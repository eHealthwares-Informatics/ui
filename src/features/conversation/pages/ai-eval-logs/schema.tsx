import { ColumnDataType, ColumnTypeFilters } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { shortText } from '../../schemas/helpers';

export const aiEvalLogsConfig: ModelConfig = {
  id: 'ai-eval-logs',
  apiProvider: conversationApi,
  title: 'AI Eval Logs',
  description:
    'Audit trail of instruction improvement runs — scores, promotion decisions, and candidate content.',
  endpoint: '/ai/eval-logs',
  columns: [
    {
      key: 'questionId',
      label: 'Question ID',
      render: (row) => shortText(row.questionId),
      filters: ColumnTypeFilters.STRING,
    },
    {
      key: 'currentScore',
      label: 'Current Score',
      render: (row) => Number(row.currentScore ?? 0).toFixed(3),
    },
    {
      key: 'candidateScore',
      label: 'Candidate Score',
      render: (row) => Number(row.candidateScore ?? 0).toFixed(3),
    },
    {
      key: 'promoted',
      label: 'Promoted',
      render: (row) => (row.promoted ? '✅ Yes' : '❌ No'),
    },
    {
      key: 'triggeredBy',
      label: 'Triggered By',
    },
    {
      key: 'candidateContent',
      label: 'Candidate',
      render: (row) => {
        const text = String(row.candidateContent ?? '');
        return text.length < 60 ? text : `${text.slice(0, 60)}...`;
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      dataType: ColumnDataType.DATE,
      sortable: true,
    },
  ],
};
