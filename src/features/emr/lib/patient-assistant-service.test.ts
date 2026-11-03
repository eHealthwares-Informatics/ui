import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-tokens', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
}));

vi.mock('@/lib/conversation-api', () => ({
  CONVERSATION_API_BASE_URL: '/api/conversation',
  conversationApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({ on: vi.fn(), off: vi.fn(), disconnect: vi.fn() })),
}));

import { conversationApi } from '@/lib/conversation-api';
import { fetchAssistantThread, startPatientEnquiry } from './patient-assistant-service';

describe('patient assistant service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts a patient enquiry with the patient MRN', async () => {
    vi.mocked(conversationApi.post).mockResolvedValue({
      data: { conversationId: 'pending-participant-1', participantId: 'participant-1' },
    });

    const result = await startPatientEnquiry({
      patientMrn: 'MRN-100',
      identity: { userId: 'user-1', email: 'doctor@example.com' },
    });

    expect(conversationApi.post).toHaveBeenCalledWith('/webhooks/web', {
      channelCode: 'EMR_WEBCHAT',
      senderExternalId: 'user-1',
      senderEmail: 'doctor@example.com',
      text: 'PATIENT_ENQUIRY=MRN-100',
      newConversation: true,
    });
    expect(result.conversationId).toBe('pending-participant-1');
  });

  it('maps exchanges and hides the start command', async () => {
    vi.mocked(conversationApi.get).mockResolvedValue({
      data: {
        items: [
          {
            id: '1',
            direction: 'inbound',
            text: 'PATIENT_ENQUIRY=MRN-100',
            createdAt: '2026-10-01T10:00:00.000Z',
          },
          {
            id: '2',
            direction: 'outbound',
            text: 'You can now make enquiries about patient MRN-100.',
            createdAt: '2026-10-01T10:00:01.000Z',
          },
          {
            id: '3',
            direction: 'inbound',
            text: 'What is the current diagnosis?',
            createdAt: '2026-10-01T10:00:02.000Z',
          },
        ],
      },
    });

    const messages = await fetchAssistantThread('conv-1');

    expect(messages).toEqual([
      {
        id: '2',
        role: 'bot',
        text: 'You can now make enquiries about patient MRN-100.',
        createdAt: '2026-10-01T10:00:01.000Z',
      },
      {
        id: '3',
        role: 'user',
        text: 'What is the current diagnosis?',
        createdAt: '2026-10-01T10:00:02.000Z',
      },
    ]);
  });
});
