import { getArrayPayload } from '@/features/components/utils';
import { communicationApi } from '@/lib/communication-api';
import { emrApi } from '@/lib/emr-api';
import {
  normalizeMessageTemplate,
  type MessageTemplate,
  type MessageTemplateInput,
  type NotificationItem,
  type NotificationSubscriptionPayload,
} from './types';

function normalizeNotification(row: Record<string, unknown>): NotificationItem {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    body: row.body == null ? null : String(row.body),
    type: String(row.type ?? 'info'),
    sourceEntityType: row.sourceEntityType == null ? null : String(row.sourceEntityType),
    sourceEntityId: row.sourceEntityId == null ? null : String(row.sourceEntityId),
    sourceEntityRef: row.sourceEntityRef == null ? null : String(row.sourceEntityRef),
    read: Boolean(row.read ?? row.readAt),
    createdAt: String(row.createdAt ?? new Date().toISOString()),
  };
}

export async function fetchNotifications(since?: string): Promise<NotificationItem[]> {
  const response = await emrApi.get('/notifications', {
    params: since ? { since } : undefined,
  });
  return getArrayPayload(response.data).map(normalizeNotification);
}

export async function fetchUnreadCount(): Promise<number> {
  const response = await emrApi.get('/notifications/unread-count');
  const payload = response.data;
  if (typeof payload === 'number') {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    const shaped = payload as Record<string, unknown>;
    const candidate = shaped.count ?? shaped.unreadCount ?? shaped.data;
    if (typeof candidate === 'number') {
      return candidate;
    }
  }
  return 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await emrApi.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await emrApi.patch('/notifications/read-all');
}

export async function registerNotificationSubscription(
  payload: NotificationSubscriptionPayload
): Promise<void> {
  await emrApi.post('/notification-subscriptions', payload);
}

export async function fetchMessageTemplates(search?: string): Promise<MessageTemplate[]> {
  const response = await emrApi.get('/message-templates', {
    params: search?.trim() ? { search: search.trim() } : undefined,
  });
  return getArrayPayload(response.data).map(normalizeMessageTemplate);
}

export async function createMessageTemplate(
  payload: MessageTemplateInput
): Promise<MessageTemplate> {
  const response = await emrApi.post('/message-templates', payload);
  return normalizeMessageTemplate(response.data);
}

export async function updateMessageTemplate(
  id: string,
  payload: Partial<MessageTemplateInput>
): Promise<MessageTemplate> {
  const response = await emrApi.patch(`/message-templates/${id}`, payload);
  return normalizeMessageTemplate(response.data);
}

export async function deleteMessageTemplate(id: string): Promise<void> {
  await emrApi.delete(`/message-templates/${id}`);
}

export type ChannelOption = { value: string; label: string };

export async function fetchChannelCodeOptions(): Promise<ChannelOption[]> {
  try {
    const response = await communicationApi.get('/communication-channels', {
      params: { limit: 100 },
    });
    return getArrayPayload(response.data).map((row) => {
      const code = String(row.code ?? row.name ?? row.id ?? '');
      const label = String(row.name ?? row.code ?? row.id ?? code);
      return { value: code, label };
    });
  } catch {
    return [];
  }
}
