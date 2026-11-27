import { getArrayPayload } from '@/components/utils';
import { conversationApi } from '@/lib/conversation-api';
import type {
  ConversationInboxResponse,
  ConversationProjection,
  ExchangeMessagesResponse,
  ParticipantRole,
} from '../types';

type InboxParams = {
  cursor?: string;
  search?: string;
  channelId?: string;
  participantId?: string;
  status?: string;
  activeOnly?: boolean;
  limit?: number;
  page?: number;
};

/**
 * Fetch conversations using the generic GET /conversations endpoint with search.
 * Returns full conversation objects (not projections).
 */
export async function fetchConversationInbox(params: InboxParams) {
  const response = await conversationApi.get('/conversations', {
    params: {
      limit: params.limit ?? 30,
      page: params.page ?? 1,
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      ...(params.channelId ? { channelId: params.channelId } : {}),
      ...(params.participantId ? { participantId: params.participantId } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });

  const data = response.data;
  // Handle { data, meta } envelope, { data: [...], items, results }, or raw array
  const raw = Array.isArray(data) ? data : (data?.data ?? data?.items ?? data?.results ?? []);
  const meta = data?.meta ?? { total: raw.length, page: 1, limit: 30 };

  // Add conversationId alias for backward compat with chat UI
  const items = raw.map((item: any) => ({
    ...item,
    conversationId: item.conversationId ?? item.id,
  }));

  return { items, meta };
}

export async function fetchConversationMessages(input: {
  conversationId: string;
  cursor?: string;
}) {
  const response = await conversationApi.get<ExchangeMessagesResponse>('/exchanges', {
    params: {
      conversationId: input.conversationId,
      limit: 30,
      cursor: input.cursor,
    },
  });

  return response.data;
}

export async function sendConversationMessage(input: {
  conversationId: string;
  channelId: string;
  senderPhone: string;
  text: string;
  attachments?: Array<{ url: string; mimeType?: string; fileName?: string }>;
}) {
  await conversationApi.post('/webhooks/web', {
    channelId: input.channelId,
    senderPhone: input.senderPhone,
    text: input.text,
    conversationId: input.conversationId,
    ...(input.attachments?.length ? { attachments: input.attachments } : {}),
  });
}

export async function sendWebhookMessage(input: {
  channelId: string;
  senderPhone: string;
  text: string;
  conversationId?: string;
  questionnaireCode?: string;
  attachments?: Array<{ url: string; mimeType?: string; fileName?: string }>;
}) {
  await conversationApi.post('/webhooks/web', {
    channelId: input.channelId,
    senderPhone: input.senderPhone,
    text: input.text,
    ...(input.conversationId ? { conversationId: input.conversationId } : {}),
    ...(input.questionnaireCode ? { questionnaireCode: input.questionnaireCode } : {}),
    ...(input.attachments?.length ? { attachments: input.attachments } : {}),
  });
}

/**
 * Upload an attachment (file / audio / document).
 *
 * The bytes go to the engine's storage chain (Cloudinary → S3 → local) and the
 * returned URL is what a document/audio question validates — so callers send it
 * as the message text with the attachment alongside.
 */
export async function uploadAttachment(file: File) {
  const form = new FormData();
  form.append('file', file, file.name);
  const response = await conversationApi.post('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data as {
    url: string;
    storage?: string;
    mimeType?: string;
    fileName?: string;
    size?: number;
  };
}

export async function markConversationRead(input: {
  conversationId: string;
  participantId?: string;
}) {
  await conversationApi.post(`/conversations/${input.conversationId}/read`, {
    participantId: input.participantId,
  });
}

export async function createConversation(input: {
  phone?: string;
  participantId?: string;
  questionnaireId: string;
  channelId: string;
  projections?: Array<{
    participantId?: string;
    phone?: string;
    channelId?: string;
    role: string;
  }>;
}) {
  const response = await conversationApi.post('/conversations', input);
  return response.data;
}

export async function addProjection(input: {
  conversationId: string;
  participantId: string;
  channelId: string;
  role: ParticipantRole;
}) {
  const response = await conversationApi.post(
    `/conversations/${input.conversationId}/projections`,
    {
      participantId: input.participantId,
      channelId: input.channelId,
      role: input.role,
    }
  );
  return response.data;
}

export async function listProjections(conversationId: string) {
  const response = await conversationApi.get<ConversationProjection[]>(
    `/conversations/${conversationId}/projections`
  );
  return response.data;
}

export async function removeParticipantProjections(input: {
  conversationId: string;
  participantId: string;
}) {
  await conversationApi.delete(
    `/conversations/${input.conversationId}/projections/${input.participantId}`
  );
}

export async function findParticipantByPhone(phone: string): Promise<{ id?: string } | null> {
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
    return (list[0] as { id?: string } | undefined) || null;
  } catch {
    return null;
  }
}

export async function createParticipant(input: { phone: string; firstName?: string }) {
  const response = await conversationApi.post('/participants', input);
  return response.data;
}

export async function fetchChannels() {
  const response = await conversationApi.get('/channels', { params: { limit: 100 } });
  return getArrayPayload(response.data);
}
