import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue, getArrayPayload } from '@/features/components/utils';
import {
  Questionnaire,
  type QuestionnaireQuestion,
} from '@/features/conversation/components/questionnaire';
import { Option } from '@/features/rxsoft/types';
import { conversationApi } from '@/lib/conversation-api';
import { ConversationLoader } from '../../features/questionnnaire/components/ConversationLoader';
import { CreateConversationForm } from '../../features/questionnnaire/components/CreateConversationForm';
import { EntryModeTabs } from '../../features/questionnnaire/components/EntryModeTabs';
import { ParticipantSearch } from '../../features/questionnnaire/components/ParticipantSearch';
import type { ConversationSession, EntryMode, AnswerValue } from './-types';
import {
  stringifyAnswer,
  resolveQuestions,
  decorateConversations,
  buildSummaryMessage,
} from './-utils';

/* ================= PAGE ================= */

function PublicQuestionnairePage() {
  const [entryMode, setEntryMode] = useState<EntryMode>('participant-phone');

  const [phoneSearch, setPhoneSearch] = useState('');
  const [questionnaire, setQuestionnaire] = useState<Option | null>();
  const [channel, setChannel] = useState<Option | null>();

  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>('');

  const [conversationId, setConversationId] = useState('');
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);

  const [loading, setLoading] = useState(false);

  const debouncedPhone = useDebouncedValue(phoneSearch, 300);

  /* ================= QUERIES ================= */

  const participantQuery = useQuery({
    queryKey: ['participants', debouncedPhone],
    queryFn: async () => {
      const res = await conversationApi.get('/participants', {
        params: { search: debouncedPhone, attribute: 'phone' },
      });
      return getArrayPayload(res.data);
    },
    enabled: !session && debouncedPhone.length >= 3,
  });

  const conversationsQuery = useQuery({
    queryKey: ['participant-conversations', selectedParticipantId],
    queryFn: async () => {
      const res = await conversationApi.get(`/participants/${selectedParticipantId}/conversations`);
      return decorateConversations(getArrayPayload(res.data) as ConversationSession[]);
    },
    enabled: !!selectedParticipantId && !session,
  });

  /* ================= HELPERS ================= */

  async function hydrateSession(next: ConversationSession) {
    const resolved = await resolveQuestions(next);
    setSession(next);
    setQuestions(resolved);
    setConversationId(next.id);
  }

  async function loadConversationById(id = conversationId) {
    if (!id) {
      return;
    }

    setLoading(true);
    try {
      const res = await conversationApi.get(`/conversations/${id}`);
      await hydrateSession(res.data);
      notifications.show({ message: 'Conversation loaded', color: 'green' });
    } catch {
      notifications.show({ message: 'Conversation not found', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  async function startConversation(payload: {
    phone: string;
    questionnaireId?: string;
    channelId?: string;
  }) {
    setLoading(true);
    try {
      const res = await conversationApi.post('/conversations', payload);
      await hydrateSession(res.data);
      notifications.show({ message: 'Conversation created', color: 'green' });
    } catch {
      notifications.show({ message: 'Failed to create conversation', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  /* ================= DERIVED ================= */
  const participants = getArrayPayload(participantQuery.data ?? []);
  const conversations = conversationsQuery.data ?? [];

  const initialAnswers = useMemo(() => {
    return (session?.context?.answers as Record<string, AnswerValue>) ?? {};
  }, [session]);

  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (session) {
      return;
    }

    const match = participants.find((p) => String(p.phone) === phoneSearch);

    if (match) {
      setSelectedParticipantId(String(match.id));
    }
  }, [participants, phoneSearch, session]);

  async function processAnswer(payload: {
    question: QuestionnaireQuestion;
    answer: AnswerValue;
    answers: Record<string, AnswerValue>;
    currentIndex: number;
    questions: QuestionnaireQuestion[];
  }) {
    if (!session?.id) {
      return {
        advance: true,
      };
    }

    try {
      const response = await conversationApi.post(`/conversations/${session.id}/process-response`, {
        message: stringifyAnswer(payload.answer),
        sender: session.participantId || '',
      });

      const latestConversationResponse = await conversationApi.get(`/conversations/${session.id}`);
      const latestSession = latestConversationResponse.data as ConversationSession;
      await hydrateSession(latestSession);

      const reason = String(response.data?.reason ?? '');
      const action = String(response.data?.action ?? '');

      if (reason === 'VALIDATION_ERROR') {
        return {
          advance: false,
          errorMessage: String(response.data?.message || 'This answer could not be processed.'),
        };
      }

      if (action === 'COMPLETED_CONVERSATION' || latestSession.status === 'COMPLETED') {
        return {
          complete: true,
        };
      }

      return {
        advance: true,
        nextQuestionId: latestSession.currentQuestionId,
        answers: payload.answers,
      };
    } catch (error: any) {
      return {
        advance: false,
        errorMessage: error?.response?.data?.message || 'Unable to process this answer right now.',
      };
    }
  }

  async function saveProgress(payload: {
    answers: Record<string, AnswerValue>;
    currentIndex: number;
    progress: number;
  }) {
    if (!session?.id) {
      return;
    }
    const nextQuestion = questions[payload.currentIndex];
    await conversationApi.patch(`/conversations/${session.id}`, {
      currentQuestionId: nextQuestion?.id,
      context: {
        ...(session.context ?? {}),
        answers: payload.answers,
        progress: payload.progress,
      },
    });
  }

  async function completeQuestionnaire(payload: {
    answers: Record<string, AnswerValue>;
    questions: QuestionnaireQuestion[];
  }) {
    if (!session?.id) {
      return;
    }

    const summary = buildSummaryMessage(payload.answers, payload.questions);

    await conversationApi.patch(`/conversations/${session.id}`, {
      status: 'COMPLETED',
      state: 'COMPLETED',
      endedAt: new Date().toISOString(),
      context: {
        ...(session.context ?? {}),
        answers: payload.answers,
        progress: 100,
        summary,
      },
    });

    if (session.channelId && phoneSearch.trim()) {
      await conversationApi.post('/channels/send-message', {
        channelId: session.channelId,
        phone: phoneSearch.trim(),
        email: '',
        title: 'Questionnaire complete',
        previewLink: false,
        message: summary,
      });
    }
  }
  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">
      {/* ENTRY MODE */}
      <EntryModeTabs value={entryMode} onChange={setEntryMode} />

      {/* MODES */}
      {entryMode === 'participant-phone' && (
        <ParticipantSearch
          phone={phoneSearch}
          setPhone={setPhoneSearch}
          participants={participants}
          loading={participantQuery.isLoading}
          selectedId={selectedParticipantId || ''}
          onSelect={setSelectedParticipantId}
          // conversations={conversations}
          // onLoadConversation={loadConversationById}
        />
      )}

      {entryMode === 'conversation-id' && (
        <ConversationLoader
          value={conversationId}
          setValue={setConversationId}
          onLoad={loadConversationById}
          loading={loading}
        />
      )}

      {entryMode === 'create-new' && (
        <CreateConversationForm
          phone={phoneSearch}
          setPhone={setPhoneSearch}
          setQuestionnaire={setQuestionnaire}
          setChannel={setChannel}
          questionnaire={questionnaire as any}
          channel={channel as any}
          onSubmit={startConversation}
          loading={loading}
        />
      )}

      {/* QUESTIONNAIRE */}
      {session && (
        <Questionnaire
          title="User Feedback"
          description="Answer the questions"
          questions={questions}
          initialAnswers={initialAnswers}
          initialCurrentQuestionId={session.currentQuestionId}
          onProcessAnswer={processAnswer}
          onSaveProgress={saveProgress}
          onComplete={completeQuestionnaire}
        />
      )}
    </div>
  );
}

/* ================= ROUTE ================= */

export const Route = createFileRoute('/questionnaire/')({
  component: PublicQuestionnairePage,
});
