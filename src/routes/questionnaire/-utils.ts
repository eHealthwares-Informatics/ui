// utils.ts

import { getArrayPayload } from '@/features/components/utils';
import { QuestionnaireQuestion } from '@/features/conversation/components/questionnaire';
import { conversationApi } from '@/lib/conversation-api';
import { AnswerValue, ConversationSession } from './-types';

export function getBooleanParam(value: string | null, fallback = true) {
  if (value == null) {
    return fallback;
  }
  return ['1', 'true', 'yes'].includes(value.toLowerCase());
}

export function stringifyAnswer(value: AnswerValue) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (value == null) {
    return '';
  }
  return String(value);
}

export function buildSummaryMessage(
  answers: Record<string, AnswerValue>,
  questions: QuestionnaireQuestion[]
) {
  return questions
    .map((question, index) => {
      const key = question.attribute || question.id || `question-${index}`;
      const value = answers[key];

      const rendered = Array.isArray(value)
        ? value.join(', ')
        : typeof value === 'boolean'
          ? value
            ? 'Yes'
            : 'No'
          : value == null || value === ''
            ? 'Not answered'
            : String(value);

      return `${question.text}: ${rendered}`;
    })
    .join('\n');
}

export async function resolveQuestions(session: ConversationSession) {
  if (session.questions?.length) {
    return session.questions;
  }

  if (!session.questionnaireId) {
    return [];
  }

  const response = await conversationApi.get('/questions', {
    params: { questionnaireId: session.questionnaireId },
  });

  return getArrayPayload(response.data) as QuestionnaireQuestion[];
}

export async function decorateConversations(items: ConversationSession[]) {
  const ids = [...new Set(items.map((i) => i.questionnaireId).filter(Boolean))];

  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await conversationApi.get(`/questionnaires/${id}`);
        return [id, res.data?.name ?? id] as const;
      } catch {
        return [id, id] as const;
      }
    })
  );

  const map = new Map(entries);

  return items.map((item) => ({
    ...item,
    questionnaireName: item.questionnaireId
      ? (map.get(item.questionnaireId) ?? item.questionnaireId)
      : 'Questionnaire',
  }));
}
