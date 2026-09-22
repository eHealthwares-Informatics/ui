import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { notifications } from '@mantine/notifications';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { conversationApi, CONVERSATION_API_BASE_URL } from '@/lib/conversation-api';
import { getAccessToken } from '@/lib/auth-tokens';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useReplyingAnimation } from '@/lib/use-replying-animation';

const ANON_PHONE_KEY = 'damorex-chatbot-phone';
export const SHOP_WEB_CHANNEL_ID = '6ab1d8afcf668f7bdb084dbb';

export interface ChatMessage {
  id: string;
  text: string;
  role: 'user' | 'bot';
  createdAt: string;
  orphan?: boolean;
  optimistic?: boolean;
}

export interface RawExchangeMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  direction: 'inbound' | 'outbound';
  text: string;
  questionId?: string;
  attribute?: string;
  createdAt: string;
  status?: string;
  orphan?: boolean;
  pendingConversationId?: string;
}

export interface ShopConversationSummary {
  conversationId: string;
  channelId?: string;
  /** Conversation title, defaulted from the questionnaire name. */
  title?: string;
  status?: string;
  state?: string;
  participant?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  lastMessage?: { id?: string; text: string; direction: string; createdAt: string };
  unreadCount?: number;
  lastMessageAt?: string;
  currentQuestion?: { id?: string; attribute?: string; text?: string };
}

type ThreadPage = { items: RawExchangeMessage[]; nextCursor?: string };

/* ------------------------------------------------------------------ */
/* Phone / guest identity                                              */
/* ------------------------------------------------------------------ */

export function generateGuestPhone(): string {
  return String(Date.now());
}

export function getStoredPhone(): string | null {
  try {
    return localStorage.getItem(ANON_PHONE_KEY);
  } catch {
    return null;
  }
}

export function storePhone(phone: string): void {
  try {
    localStorage.setItem(ANON_PHONE_KEY, phone);
  } catch {
    /* ignore private-mode failures */
  }
}

export function clearStoredPhone(): void {
  try {
    localStorage.removeItem(ANON_PHONE_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Socket                                                              */
/* ------------------------------------------------------------------ */

let shopSocket: Socket | null = null;
let socketIdentity: { phone?: string; guest?: boolean } = {};

export function connectShopChat(identity: {
  phone?: string;
  guest?: boolean;
}): Socket {
  const changed =
    identity.phone !== socketIdentity.phone || identity.guest !== socketIdentity.guest;
  socketIdentity = identity;

  if (shopSocket) {
    if (changed) {
      // Re-auth and reconnect the same instance so listeners registered by
      // other mounted surfaces (widget + page) keep working.
      shopSocket.auth = {
        token: getAccessToken(),
        phone: identity.phone,
        guest: identity.guest ?? false,
      };
      shopSocket.disconnect().connect();
    }
    return shopSocket;
  }

  const socketUrl =
    (import.meta.env.VITE_CONVERSATION_SOCKET_URL as string | undefined) ??
    CONVERSATION_API_BASE_URL.replace(/\/api\/?$/, '');

  shopSocket = io(`${socketUrl}/conversations`, {
    transports: ['websocket'],
    auth: {
      token: getAccessToken(),
      phone: identity.phone,
      guest: identity.guest ?? false,
    },
  });

  return shopSocket;
}

export function disconnectShopChat(): void {
  if (shopSocket) {
    shopSocket.removeAllListeners();
    shopSocket.disconnect();
    shopSocket = null;
  }
}

/* ------------------------------------------------------------------ */
/* API helpers                                                         */
/* ------------------------------------------------------------------ */

export async function findParticipantByPhone(
  phone: string,
): Promise<{ id: string; phone?: string } | null> {
  try {
    const response = await conversationApi.get('/participants', {
      params: { phone },
    });
    const data = response.data as
      | { data?: Array<Record<string, unknown>>; items?: Array<Record<string, unknown>> }
      | Array<Record<string, unknown>>;
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : (data?.items ?? []);
    const first = list[0] as { id?: string; phone?: string } | undefined;
    return first?.id ? { id: first.id, phone: first.phone } : null;
  } catch {
    return null;
  }
}

export async function sendWebChatMessage(input: {
  senderPhone: string;
  text: string;
  conversationId?: string;
  questionnaireCode?: string;
}): Promise<{ conversationId?: string; participantId?: string }> {
  const body: Record<string, unknown> = {
    channelId: SHOP_WEB_CHANNEL_ID,
    senderPhone: input.senderPhone,
    text: input.text,
  };
  if (input.conversationId) {
    body.conversationId = input.conversationId;
  }
  if (input.questionnaireCode) {
    body.questionnaireCode = input.questionnaireCode;
  }

  const response = await conversationApi.post('/webhooks/web', body);
  return response.data ?? {};
}

async function fetchShopThread(input: {
  conversationId: string;
  cursor?: string;
}): Promise<ThreadPage> {
  const response = await conversationApi.get<ThreadPage>('/exchanges', {
    params: {
      conversationId: input.conversationId,
      limit: 30,
      cursor: input.cursor,
    },
  });
  return response.data;
}

async function fetchShopInbox(input: {
  participantId: string;
  cursor?: string;
}): Promise<{ items: ShopConversationSummary[]; nextCursor?: string }> {
  const response = await conversationApi.get('/conversations/inbox', {
    params: {
      participantId: input.participantId,
      activeOnly: false,
      limit: 30,
      cursor: input.cursor,
    },
  });
  const data = response.data as {
    items?: ShopConversationSummary[];
    nextCursor?: string;
  };
  return { items: data?.items ?? [], nextCursor: data?.nextCursor };
}

/* ------------------------------------------------------------------ */
/* Query keys                                                          */
/* ------------------------------------------------------------------ */

export const shopChatKeys = {
  thread: (conversationId?: string | null) =>
    ['shop-chat-thread', conversationId] as const,
  inbox: (participantId?: string | null) => ['shop-chat-inbox', participantId] as const,
  participant: (phone?: string) => ['shop-chat-participant', phone] as const,
};

function toChatMessage(raw: RawExchangeMessage): ChatMessage {
  return {
    id: raw.id,
    text: raw.text,
    role: raw.direction === 'inbound' ? 'user' : 'bot',
    createdAt: raw.createdAt,
    orphan: raw.orphan,
  };
}

function prependToThread(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  raw: RawExchangeMessage,
): void {
  queryClient.setQueryData<{ pages: ThreadPage[]; pageParams: Array<string | undefined> }>(
    shopChatKeys.thread(conversationId),
    (current) => {
      if (!current || current.pages.length === 0) {
        return current;
      }
      const exists = current.pages.some((page) =>
        page.items.some((item) => item.id === raw.id),
      );
      if (exists) {
        return current;
      }
      const [first, ...rest] = current.pages;
      return {
        ...current,
        pages: [{ ...first, items: [raw, ...first.items] }, ...rest],
      };
    },
  );
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

/** Resolve (but do not create) the conversation participant for a phone. */
export function useShopParticipant(phone?: string) {
  return useQuery({
    queryKey: shopChatKeys.participant(phone),
    enabled: Boolean(phone),
    queryFn: () => findParticipantByPhone(phone!),
    staleTime: 60_000,
  });
}

export function useShopInbox(participantId?: string | null) {
  return useInfiniteQuery({
    queryKey: shopChatKeys.inbox(participantId),
    enabled: Boolean(participantId),
    queryFn: ({ pageParam }) =>
      fetchShopInbox({ participantId: participantId!, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  });
}

export function useShopChatThread(input: {
  senderPhone: string;
  guest: boolean;
  enabled?: boolean;
  initialConversationId?: string | null;
  /** When known, lets the hook recover the real id if a creation event was missed. */
  participantId?: string | null;
}) {
  const {
    senderPhone,
    guest,
    enabled = true,
    initialConversationId = null,
    participantId,
  } = input;
  const queryClient = useQueryClient();
  const [conversationId, setConversationIdState] = useState<string | null>(
    initialConversationId,
  );
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);
  // True when the server told us the open conversation has ended; the widget
  // shows a notice and the next send starts a brand-new conversation.
  const [ended, setEnded] = useState(false);
  const conversationIdRef = useRef<string | null>(initialConversationId);
  const endedIdRef = useRef<string | null>(null);
  const replyCountRef = useRef(0);
  const pendingStartedAtRef = useRef<number>(
    initialConversationId?.startsWith('pending-') ? Date.now() : 0,
  );

  const openConversation = useCallback((id: string | null) => {
    if (id?.startsWith('pending-')) {
      pendingStartedAtRef.current = Date.now();
    }
    conversationIdRef.current = id;
    setConversationIdState(id);
    setOptimistic([]);
    setAwaitingReply(false);
    replyCountRef.current = 0;
    // Opening a real conversation means any previous "ended" notice is stale.
    if (id && !id.startsWith('pending-')) {
      endedIdRef.current = null;
      setEnded(false);
    }
  }, []);

  const threadQuery = useInfiniteQuery({
    queryKey: shopChatKeys.thread(conversationId),
    enabled: enabled && Boolean(conversationId),
    queryFn: ({ pageParam }) =>
      fetchShopThread({ conversationId: conversationId!, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    // staleTime avoids redundant refetches on revisit, while a newly-opened
    // (or event-invalidated) thread still fetches on mount.
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const serverMessages = useMemo<ChatMessage[]>(() => {
    const items = (threadQuery.data?.pages.flatMap((page) => page.items) ?? [])
      .slice()
      .reverse();
    return items.map(toChatMessage);
  }, [threadQuery.data]);

  const rawMessages = useMemo<ChatMessage[]>(() => {
    // Dedupe by id first — a message delivered by an event and later returned
    // by the paginated refetch must only render once.
    const byId = new Map<string, ChatMessage>();
    for (const message of serverMessages) {
      byId.set(message.id, message);
    }

    // Then reconcile optimistic messages against their server counterpart.
    // Server timestamps differ from the optimistic one, so match on
    // role + text within a short window rather than exact time.
    if (optimistic.length > 0) {
      const serverTimesBySignature = new Map<string, number[]>();
      for (const message of serverMessages) {
        const signature = `${message.role}|${message.text.trim()}`;
        const times = serverTimesBySignature.get(signature) ?? [];
        times.push(new Date(message.createdAt).getTime());
        serverTimesBySignature.set(signature, times);
      }

      for (const message of optimistic) {
        const signature = `${message.role}|${message.text.trim()}`;
        const times = serverTimesBySignature.get(signature) ?? [];
        const optimisticTime = new Date(message.createdAt).getTime();
        const covered = times.some(
          (serverTime) => Math.abs(serverTime - optimisticTime) < 15_000,
        );
        if (!covered && !byId.has(message.id)) {
          byId.set(message.id, message);
        }
      }
    }

    return [...byId.values()].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }, [serverMessages, optimistic]);

  // Lag incoming bot replies behind a typing indicator (delay scales with the
  // reply length) so the UI can show the assistant "writing".
  const { visible: messages, replying } = useReplyingAnimation(rawMessages, {
    key: conversationId,
    isIncoming: (message) => message.role === 'bot',
    getText: (message) => message.text,
  });

  const latestBotCountRef = useRef(0);
  useEffect(() => {
    const count = rawMessages.filter((message) => message.role === 'bot').length;
    latestBotCountRef.current = count;
    if (count > replyCountRef.current) {
      setAwaitingReply(false);
    }
  }, [rawMessages]);

  // A reply that has arrived (even while still being "typed") means we are no
  // longer awaiting it.
  useEffect(() => {
    if (replying) {
      setAwaitingReply(false);
    }
  }, [replying]);

  const awaitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startAwaitingReply = useCallback(() => {
    if (awaitingTimerRef.current) {
      clearTimeout(awaitingTimerRef.current);
    }
    replyCountRef.current = latestBotCountRef.current;
    setAwaitingReply(true);
    awaitingTimerRef.current = setTimeout(() => setAwaitingReply(false), 30_000);
  }, []);
  useEffect(
    () => () => {
      if (awaitingTimerRef.current) {
        clearTimeout(awaitingTimerRef.current);
      }
    },
    [],
  );

  // Once the server copy is present, drop the local optimistic entry so it can
  // never resurface later (e.g. after a page eviction).
  useEffect(() => {
    if (serverMessages.length === 0) {
      return;
    }
    setOptimistic((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const next = prev.filter((optimisticMessage) => {
        const signature = `${optimisticMessage.role}|${optimisticMessage.text.trim()}`;
        const optimisticTime = new Date(optimisticMessage.createdAt).getTime();
        return !serverMessages.some(
          (serverMessage) =>
            `${serverMessage.role}|${serverMessage.text.trim()}` === signature &&
            Math.abs(new Date(serverMessage.createdAt).getTime() - optimisticTime) <
              15_000,
        );
      });
      return next.length === prev.length ? prev : next;
    });
  }, [serverMessages]);

  // Fallback: while the thread is still `pending-`, poll the participant's
  // inbox so a missed `conversation.message.created` event (e.g. the opening
  // message is sent before the socket finishes joining rooms) can't strand the
  // UI on the pending id. Once a real conversation appears we adopt it.
  const discoveryEnabled =
    enabled &&
    Boolean(participantId) &&
    Boolean(conversationId?.startsWith('pending-'));

  const discoveryQuery = useQuery({
    queryKey: ['shop-chat-discovery', participantId],
    enabled: discoveryEnabled,
    queryFn: () => fetchShopInbox({ participantId: participantId! }),
    refetchInterval: discoveryEnabled ? 2500 : false,
  });

  useEffect(() => {
    if (!discoveryEnabled) {
      return;
    }
    const items = discoveryQuery.data?.items ?? [];
    const startedAt = pendingStartedAtRef.current - 5_000;
    const real = items.find((conversation) => {
      if (!conversation.conversationId || conversation.conversationId.startsWith('pending-')) {
        return false;
      }
      // Only adopt a conversation that was touched after this pending thread
      // began — otherwise we'd jump to an older, unrelated conversation.
      const lastMessageAt = conversation.lastMessageAt
        ? new Date(conversation.lastMessageAt).getTime()
        : 0;
      return lastMessageAt >= startedAt;
    });
    if (real?.conversationId && real.conversationId !== conversationId) {
      openConversation(real.conversationId);
      queryClient.invalidateQueries({
        queryKey: shopChatKeys.thread(real.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: ['shop-chat-inbox'] });
    }
  }, [
    discoveryEnabled,
    discoveryQuery.data,
    conversationId,
    openConversation,
    queryClient,
  ]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = connectShopChat({ phone: senderPhone, guest });
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const handleMessage = (raw: RawExchangeMessage) => {
      if (!raw?.conversationId) {
        return;
      }
      // Ignore messages replayed from a conversation the server has ended —
      // its thread was reset and re-adopting the stale id would strand the UI
      // on a dead conversation.
      if (raw.conversationId === endedIdRef.current) {
        return;
      }
      const isPending = raw.conversationId.startsWith('pending-');
      const current = conversationIdRef.current;

      // Adopt the first thread id we learn about (e.g. the pending thread the
      // webhook just created, or a conversation someone started elsewhere).
      if (!current) {
        openConversation(raw.conversationId);
      } else if (!isPending && current.startsWith('pending-')) {
        // Conversation created: migrate the pending thread to the real id.
        openConversation(raw.conversationId);
        queryClient.invalidateQueries({ queryKey: shopChatKeys.thread(raw.conversationId) });
        queryClient.invalidateQueries({ queryKey: shopChatKeys.thread(current) });
        queryClient.invalidateQueries({ queryKey: shopChatKeys.inbox(undefined) });
        return;
      } else if (current && raw.conversationId !== current) {
        // Message belongs to a different thread than the one on screen.
        queryClient.invalidateQueries({ queryKey: shopChatKeys.inbox(undefined) });
        return;
      }

      // Update the UI immediately from the event payload, then reconcile with
      // a background paginated fetch.
      prependToThread(queryClient, raw.conversationId, raw);
      queryClient.invalidateQueries({ queryKey: shopChatKeys.thread(raw.conversationId) });
      queryClient.invalidateQueries({ queryKey: ['shop-chat-inbox'] });
    };

    const handleEnded = (payload: { conversationId?: string } | undefined) => {
      const id = payload?.conversationId;
      if (!id) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['shop-chat-inbox'] });
      const current = conversationIdRef.current;
      if (!current || id !== current) {
        return;
      }
      // The server ended the open conversation: drop its cached thread and
      // reset the id so the next send starts a brand-new conversation.
      queryClient.removeQueries({ queryKey: shopChatKeys.thread(current) });
      endedIdRef.current = id;
      openConversation(null);
      setEnded(true);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('conversation.message.orphan', handleMessage);
    socket.on('conversation.message.created', handleMessage);
    socket.on('conversation.ended', handleEnded);

    setConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('conversation.message.orphan', handleMessage);
      socket.off('conversation.message.created', handleMessage);
      socket.off('conversation.ended', handleEnded);
    };
  }, [enabled, senderPhone, guest, queryClient, openConversation]);

  const send = useCallback(
    async (text: string, questionnaireCode?: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) {
        return;
      }

      const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        text: trimmed,
        role: 'user',
        createdAt: new Date().toISOString(),
        optimistic: true,
      };
      setOptimistic((prev) => [...prev, optimisticMessage]);
      setSending(true);

      try {
        const result = await sendWebChatMessage({
          senderPhone,
          text: trimmed,
          conversationId: conversationIdRef.current ?? undefined,
          questionnaireCode,
        });
        if (result?.conversationId && result.conversationId !== conversationIdRef.current) {
          openConversation(result.conversationId);
        }
        if (conversationIdRef.current) {
          queryClient.invalidateQueries({
            queryKey: shopChatKeys.thread(conversationIdRef.current),
          });
        }
        // Show the "assistant is replying" animation until a bot message lands.
        startAwaitingReply();
        // The webhook may have created the participant on first contact —
        // refresh it so the inbox can resolve the participant-scoped list.
        queryClient.invalidateQueries({
          queryKey: shopChatKeys.participant(senderPhone),
        });
        queryClient.invalidateQueries({ queryKey: ['shop-chat-inbox'] });
      } catch (error) {
        setOptimistic((prev) => prev.filter((message) => message.id !== optimisticId));
        notifications.show({
          message: getApiErrorMessage(error),
          color: 'red',
        });
      } finally {
        setSending(false);
      }
    },
    [senderPhone, sending, queryClient, openConversation, startAwaitingReply],
  );

  const clear = useCallback(() => {
    setOptimistic([]);
    openConversation(null);
  }, [openConversation]);

  /**
   * Start a brand-new conversation: drop the current thread (and its cached
   * pages) and reset the conversation id so the next send starts fresh.
   */
  const startNew = useCallback(() => {
    const previous = conversationIdRef.current;
    if (previous && !previous.startsWith('pending-')) {
      queryClient.removeQueries({ queryKey: shopChatKeys.thread(previous) });
    }
    pendingStartedAtRef.current = 0;
    replyCountRef.current = 0;
    setOptimistic([]);
    setAwaitingReply(false);
    openConversation(null);
  }, [openConversation, queryClient]);

  return {
    conversationId,
    connected,
    sending,
    ended,
    // True whenever the assistant is "writing": posting, awaiting a reply, or
    // holding a freshly-arrived reply behind the typing lag.
    typing: sending || awaitingReply || replying,
    messages,
    send,
    clear,
    startNew,
    openConversation,
    hasMore: Boolean(threadQuery.hasNextPage),
    loadingMore: threadQuery.isFetchingNextPage,
    isLoading: threadQuery.isLoading,
    isFetching: threadQuery.isFetching,
    fetchOlder: threadQuery.fetchNextPage,
  };
}
