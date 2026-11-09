import { ColumnDataType, ColumnTypeFilters } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { shortText } from '../../schemas/helpers';

export const aiInstructionsConfig: ModelConfig = {
  id: 'ai-instructions',
  apiProvider: conversationApi,
  title: 'AI Instructions',
  description:
    'Versioned AI instructions for question extraction, with scoring and promotion history.',
  endpoint: '/ai/instructions',
  columns: [
    {
      key: 'questionId',
      label: 'Question ID',
      render: (row) => shortText(row.questionId),
      filters: ColumnTypeFilters.STRING,
    },
    {
      key: 'activeInstructions',
      label: 'Active Instructions',
      render: (row) => {
        const text = String(row.activeInstructions ?? '');
        return text.length < 80 ? text : `${text.slice(0, 80)}...`;
      },
    },
    {
      key: 'activeScore',
      label: 'Score',
      render: (row) => {
        const score = Number(row.activeScore ?? 0);
        return `${score.toFixed(3)}`;
      },
    },
    {
      key: 'versionsCount',
      label: 'Versions',
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      dataType: ColumnDataType.DATE,
      sortable: true,
    },
  ],
};
