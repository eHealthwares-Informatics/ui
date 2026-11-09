import { ParticipantCell } from '@/features/conversation/components/participant-cell';
import { ColumnDataType, ColumnTypeFilters, EQUALS_WITH_OPTIONS } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import {
  CHANNEL_TYPE_OPTIONS,
  EXCHANGE_DIRECTION_OPTIONS,
  EXCHANGE_STATUS_OPTIONS,
} from '../../schemas/constants';
import { shortText, withDefaultActions } from '../../schemas/helpers';

export const exchangesConfig: ModelConfig = withDefaultActions({
  id: 'exchanges',
  title: 'Exchanges',
  description:
    'Review inbound and outbound channel exchanges, message lifecycle, and payload metadata.',
  endpoint: '/exchanges',
  columns: [
    {
      key: 'channelType',
      label: 'Channel',
      filters: EQUALS_WITH_OPTIONS(CHANNEL_TYPE_OPTIONS),
    },
    {
      key: 'direction',
      label: 'Direction',
      filters: EQUALS_WITH_OPTIONS(EXCHANGE_DIRECTION_OPTIONS),
    },
    {
      key: 'status',
      label: 'Status',
      filters: EQUALS_WITH_OPTIONS(EXCHANGE_STATUS_OPTIONS),
    },
    { key: 'conversationId', label: 'Conversation ID', filters: ColumnTypeFilters.STRING },
    {
      key: 'senderId',
      label: 'Sender',
      filters: ColumnTypeFilters.STRING,
      render: (row) => <ParticipantCell participantId={String(row.senderId ?? '')} />,
    },
    {
      key: 'receiverId',
      label: 'Receiver',
      filters: ColumnTypeFilters.STRING,
      render: (row) => <ParticipantCell participantId={String(row.receiverId ?? '')} />,
    },
    {
      key: 'messageId',
      label: 'Message ID',
      filters: ColumnTypeFilters.STRING,
      render: (row) => shortText(row.messageId),
    },
    {
      key: 'message',
      label: 'Message',
      filters: ColumnTypeFilters.STRING,
      render: (row) => shortText(row.message),
    },
    {
      key: 'createdAt',
      label: 'CreatedAt',
      dataType: ColumnDataType.DATE,
      filters: ColumnTypeFilters.DATE,
      sortable: true,
    },
  ],
  detailPathBuilder: (row) => `/conversation/exchanges/${String(row.id)}`,
});
