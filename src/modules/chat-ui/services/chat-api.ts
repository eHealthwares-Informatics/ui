import { conversationApi } from '@/lib/conversation-api';
import type {
  ConversationInboxResponse,
  ConversationProjection,
  ExchangeMessagesResponse,
  InboxMode,
  ParticipantRole,
} from '../types';

type InboxParams = {
  cursor?: string;
  search?: string;
  channelId?: string;
  participantId?: string;
  status?: string;
  activeOnly?: boolean;
  mode?: InboxMode;
};

export async function fetchConversationInbox(params: InboxParams) {
  const response = await conversationApi.get<ConversationInboxResponse>('/conversations/inbox', {
    params: {
      limit: 30,
      activeOnly: true,
      ...params,
    },
  });

  return response.data;
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
}) {
  await conversationApi.post('/webhooks/web', {
    channelId: input.channelId,
    senderPhone: input.senderPhone,
    text: input.text,
    conversationId: input.conversationId,
  });
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
    },
  );
  return response.data;
}

export async function listProjections(conversationId: string) {
  const response = await conversationApi.get<ConversationProjection[]>(
    `/conversations/${conversationId}/projections`,
  );
  return response.data;
}

export async function removeParticipantProjections(input: {
  conversationId: string;
  participantId: string;
}) {
  await conversationApi.delete(
    `/conversations/${input.conversationId}/projections/${input.participantId}`,
  );
}

export async function findParticipantByPhone(phone: string) {
  try {
    const response = await conversationApi.get('/participants', {
      params: { phone },
    });
    const data = response.data;
    return (Array.isArray(data) ? data[0] : data?.items?.[0]) || null;
  } catch {
    return null;
  }
}

export async function createParticipant(input: { phone: string; firstName?: string }) {
  const response = await conversationApi.post('/participants', input);
  return response.data;
}
