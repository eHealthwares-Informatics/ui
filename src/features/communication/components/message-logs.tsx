import { Badge } from '@mantine/core';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SelectField } from '@/features/components/form/select';
import { RxPage } from '@/features/components/page/rx-page';
import { PaginatedDataTable } from '@/features/components/table/paginated-data-table';
import { Option } from '@/features/rxsoft/types';
import { MESSAGE_STATUS_OPTIONS, MESSAGE_TYPE_OPTIONS } from '../types/constants';
import {
  JsonPreviewDialog,
  getOption,
  getString,
  normalizeRows,
  useCommunicationList,
} from './shared';

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'recipientEmail', label: 'Recipient', width: '200px' },
  { key: 'messageType', label: 'Type', width: '100px' },
  { key: 'subject', label: 'Subject', width: '200px' },
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'sentAt', label: 'Sent At', width: '150px' },
  { key: 'deliveredAt', label: 'Delivered At', width: '150px' },
];

export function MessageLogsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Option>(getOption(''));
  const [typeFilter, setTypeFilter] = useState<Option>(getOption(''));
  const [selectedRow] = useState<any>(null);
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);

  const extraParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (statusFilter) {
      params.status = statusFilter;
    }
    if (typeFilter) {
      params.messageType = typeFilter;
    }
    return params;
  }, [statusFilter, typeFilter]);

  const { data: logs = [], isLoading } = useCommunicationList('message-logs', search, extraParams);

  const normalizedRows = useMemo(() => normalizeRows(logs), [logs]);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      sent: 'bg-green-100 text-green-800',
      delivered: 'bg-blue-100 text-blue-800',
      read: 'bg-purple-100 text-purple-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      sending: 'bg-orange-100 text-orange-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <RxPage title="Message Logs" description="View sent messages and delivery status">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <SelectField
          label=""
          placeholder="Filter by status"
          options={MESSAGE_STATUS_OPTIONS}
          value={statusFilter}
          onChange={(option: any) => setStatusFilter(option)}
          className="w-48"
        />

        <SelectField
          label=""
          placeholder="Filter by type"
          options={MESSAGE_TYPE_OPTIONS}
          value={typeFilter}
          onChange={(option: any) => setTypeFilter(option)}
          className="w-48"
        />
      </div>

      <PaginatedDataTable
        rows={normalizedRows}
        columns={columns.map((col) => ({
          ...col,
          render:
            col.key === 'status'
              ? (value: any) => (
                  <Badge className={getStatusBadge(getString(value))}>{getString(value)}</Badge>
                )
              : undefined,
        }))}
        isLoading={isLoading}
      />

      {/* JSON Preview Dialog */}
      <JsonPreviewDialog
        data={selectedRow || {}}
        title="Message Log Details"
        open={isJsonDialogOpen}
        onOpenChange={setIsJsonDialogOpen}
      />
    </RxPage>
  );
}
