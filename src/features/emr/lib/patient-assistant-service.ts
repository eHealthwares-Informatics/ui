import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/auth-tokens';
import { conversationApi, CONVERSATION_API_BASE_URL } from '@/lib/conversation-api';

export const EMR_ASSISTANT_CHANNEL_CODE = 'EMR_WEBCHAT';

export type AssistantIdentity = {
  userId: string;
  email?: string;
  phone?: string;
};

export type AssistantMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  createdAt: string;
  optimistic?: boolean;
};

type RawExchange = {
  id: string;
  direction: 'inbound' | 'outbound';
  text: string;
  createdAt: string;
};

type ThreadPage = { items: RawExchange[]; nextCursor?: string };

type ConversationSummary = {
  conversationId?: string;
  title?: string;
  lastMessageAt?: string;
  questionnaire?: { name?: string } | null;
};

const STORAGE_PREFIX = 'emr-patient-assistant';

export function assistantStorageKey(userId: string, patientMrn: string): string {
  return `${STORAGE_PREFIX}:${userId}:${patientMrn}`;
}

export function readStoredConversationId(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storeConversationId(key: string, conversationId: string): void {
  try {
    localStorage.setItem(key, conversationId);
  } catch {
    /* ignore private-mode failures */
  }
}

export function clearStoredConversationId(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export async function startPatientEnquiry(input: {
  patientMrn: string;
  identity: AssistantIdentity;
}): Promise<{ conversationId?: string; participantId?: string }> {
  const response = await conversationApi.post('/webhooks/web', {
    channelCode: EMR_ASSISTANT_CHANNEL_CODE,
    senderExternalId: input.identity.userId,
    ...(input.identity.email ? { senderEmail: input.identity.email } : {}),
    ...(input.identity.phone ? { senderPhone: input.identity.phone } : {}),
    text: `PATIENT_ENQUIRY=${input.patientMrn}`,
    newConversation: true,
  });
  return response.data ?? {};
}

export async function sendAssistantMessage(input: {
  conversationId?: string;
  text: string;
  identity: AssistantIdentity;
}): Promise<{ conversationId?: string; participantId?: string }> {
  const body: Record<string, unknown> = {
    channelCode: EMR_ASSISTANT_CHANNEL_CODE,
    senderExternalId: input.identity.userId,
    ...(input.identity.email ? { senderEmail: input.identity.email } : {}),
    ...(input.identity.phone ? { senderPhone: input.identity.phone } : {}),
    text: input.text,
  };
  if (input.conversationId && !input.conversationId.startsWith('pending-')) {
    body.conversationId = input.conversationId;
  }
  const response = await conversationApi.post('/webhooks/web', body);
  return response.data ?? {};
}

export async function fetchAssistantThread(
  conversationId: string
): Promise<AssistantMessage[]> {
  const response = await conversationApi.get<ThreadPage>('/exchanges', {
    params: { conversationId, limit: 50 },
  });
  const items = response.data?.items ?? [];
  return items
    .filter((item) => !item.text.startsWith('PATIENT_ENQUIRY='))
    .map((item): AssistantMessage => ({
      id: item.id,
      role: item.direction === 'inbound' ? 'user' : 'bot',
      text: item.text,
      createdAt: item.createdAt,
    }))
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
}

/** Best-effort discovery when the conversation.created socket event was missed. */
export async function discoverPatientEnquiryConversation(
  participantId: string,
  startedAt: number
): Promise<string | null> {
  try {
    const response = await conversationApi.get<{
      items?: ConversationSummary[];
      data?: ConversationSummary[];
    }>('/conversations/inbox', {
      params: { participantId, activeOnly: false, limit: 30 },
    });
    const items = response.data?.items ?? response.data?.data ?? [];
    const match = items.find((item) => {
      const title = item.title ?? item.questionnaire?.name ?? '';
      if (!title.toLowerCase().includes('patient enquiry')) return false;
      const last = item.lastMessageAt
        ? new Date(item.lastMessageAt).getTime()
        : 0;
      return last >= startedAt - 10_000;
    });
    return match?.conversationId ?? null;
  } catch {
    return null;
  }
}

export function connectAssistantSocket(): Socket {
  const socketUrl =
    (import.meta.env.VITE_CONVERSATION_SOCKET_URL as string | undefined) ??
    CONVERSATION_API_BASE_URL.replace(/\/api\/?$/, '');
  return io(`${socketUrl}/conversations`, {
    transports: ['websocket'],
    auth: { token: getAccessToken() },
  });
}
