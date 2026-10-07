import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  registerNotificationSubscription,
} from './api';
import type { NotificationItem, NotificationSubscriptionPayload } from './types';

const POLL_INTERVAL_MS = 30_000;
const INITIAL_LOOKBACK_MS = 24 * 60 * 60 * 1000;

export const NOTIFICATIONS_FEED_KEY = ['emr', 'notifications', 'feed'] as const;
export const NOTIFICATIONS_UNREAD_KEY = ['emr', 'notifications', 'unread-count'] as const;

function mergeNotifications(
  current: NotificationItem[],
  incoming: NotificationItem[]
): NotificationItem[] {
  const byId = new Map<string, NotificationItem>();
  for (const item of current) {
    byId.set(item.id, item);
  }
  for (const item of incoming) {
    const existing = byId.get(item.id);
    byId.set(item.id, existing ? { ...existing, ...item } : item);
  }
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const itemsRef = useRef<NotificationItem[]>([]);
  const sinceRef = useRef<string>('');

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const feedQuery = useQuery({
    queryKey: NOTIFICATIONS_FEED_KEY,
    queryFn: () => {
      if (!sinceRef.current) {
        sinceRef.current = new Date(Date.now() - INITIAL_LOOKBACK_MS).toISOString();
      }
      return fetchNotifications(sinceRef.current);
    },
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS - 5_000,
  });

  useEffect(() => {
    const incoming = feedQuery.data;
    if (!incoming || incoming.length === 0) {
      return;
    }
    setItems((prev) => mergeNotifications(prev, incoming));
    const latest = incoming.reduce(
      (acc, item) => (item.createdAt > acc ? item.createdAt : acc),
      sinceRef.current || incoming[0].createdAt
    );
    sinceRef.current = latest;
  }, [feedQuery.data]);

  const unreadQuery = useQuery({
    queryKey: NOTIFICATIONS_UNREAD_KEY,
    queryFn: fetchUnreadCount,
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS - 5_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id: string) => {
      const previousItems = itemsRef.current;
      const previousCount = queryClient.getQueryData<number>(NOTIFICATIONS_UNREAD_KEY);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
      if (typeof previousCount === 'number') {
        queryClient.setQueryData(NOTIFICATIONS_UNREAD_KEY, Math.max(0, previousCount - 1));
      }
      return { previousItems, previousCount };
    },
    onError: (error, _id, context) => {
      if (context) {
        setItems(context.previousItems);
        if (typeof context.previousCount === 'number') {
          queryClient.setQueryData(NOTIFICATIONS_UNREAD_KEY, context.previousCount);
        }
      }
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      const previousItems = itemsRef.current;
      const previousCount = queryClient.getQueryData<number>(NOTIFICATIONS_UNREAD_KEY);
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      queryClient.setQueryData(NOTIFICATIONS_UNREAD_KEY, 0);
      return { previousItems, previousCount };
    },
    onError: (error, _variables, context) => {
      if (context) {
        setItems(context.previousItems);
        if (typeof context.previousCount === 'number') {
          queryClient.setQueryData(NOTIFICATIONS_UNREAD_KEY, context.previousCount);
        }
      }
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
    },
  });

  return {
    items,
    unreadCount: typeof unreadQuery.data === 'number' ? unreadQuery.data : 0,
    isLoading: feedQuery.isLoading,
    isError: feedQuery.isError,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}

export function useNotificationSubscription(
  payload: NotificationSubscriptionPayload | null,
  enabled: boolean
) {
  const lastKeyRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: registerNotificationSubscription,
    onError: () => undefined,
  });

  // Debounce on user presence only — body no longer carries tenant ids.
  const registerKey = payload ? 'register' : '';

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (lastKeyRef.current === registerKey) {
      return;
    }
    lastKeyRef.current = registerKey;
    mutation.mutate(payload ?? {});
  }, [enabled, registerKey, payload, mutation]);
}
