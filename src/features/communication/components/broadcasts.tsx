import { Button, Modal, TextInput, Textarea, Badge, Stack, Grid } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { JsonEditorField } from '@/components/form/json-editor-field';
import { SelectField } from '@/components/form/select';
import { RxPage } from '@/components/page/rx-page';
import { PaginatedDataTable } from '@/components/table/paginated-data-table';
import { Option } from '@/features/rxsoft/types';
import { BROADCAST_STATUS_OPTIONS } from '../types/constants';
import {
  DialogActions,
  JsonPreviewDialog,
  getDirtyPayload,
  getString,
  normalizeRows,
  useCommunicationCrud,
  useCommunicationList,
  CommunicationRow,
  getOption,
} from './shared';

type BroadcastFormState = {
  id?: string;
  name: string;
  description: string;
  messageTemplateId: string;
  channelIds: string[];
  recipientCriteria: Record<string, unknown>;
  scheduledAt: string;
  status: Option;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  metadata: Record<string, unknown>;
};

const defaultFormState: BroadcastFormState = {
  name: '',
  description: '',
  messageTemplateId: '',
  channelIds: [],
  recipientCriteria: {},
  scheduledAt: '',
  status: { value: 'draft', label: 'Draft' },
  totalRecipients: 0,
  sentCount: 0,
  failedCount: 0,
  metadata: {},
};

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'totalRecipients', label: 'Recipients' },
  { key: 'sentCount', label: 'Sent' },
  { key: 'scheduledAt', label: 'Scheduled' },
  { key: 'createdAt', label: 'Created' },
];

export function BroadcastsPage() {
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<CommunicationRow | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [formState, setFormState] = useState<BroadcastFormState>(defaultFormState);

  const { data: broadcasts = [], isLoading } = useCommunicationList('broadcasts', search);

  const { createMutation, updateMutation, deleteMutation } = useCommunicationCrud('broadcasts');

  const rows = useMemo(() => normalizeRows(broadcasts), [broadcasts]);

  const openCreate = () => {
    setFormState(defaultFormState);
    setSelectedRow(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: CommunicationRow) => {
    setSelectedRow(row);

    setFormState({
      id: getString(row.id),
      name: getString(row.name),
      description: getString(row.description),
      messageTemplateId: getString(row.messageTemplateId),
      channelIds: (row.channelIds as string[]) ?? [],
      recipientCriteria: (row.recipientCriteria as Record<string, unknown>) ?? {},
      scheduledAt: getString(row.scheduledAt),
      status: getOption(row.status) || getOption('draft'),
      totalRecipients: Number(row.totalRecipients ?? 0),
      sentCount: Number(row.sentCount ?? 0),
      failedCount: Number(row.failedCount ?? 0),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    });

    setIsFormOpen(true);
  };

  const openDelete = (row: CommunicationRow) => {
    setSelectedRow(row);
    setIsDeleteOpen(true);
  };

  const openJson = (row: CommunicationRow) => {
    setSelectedRow(row);
    setIsJsonOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...formState };
    delete payload.id;

    if (formState.id) {
      await updateMutation.mutateAsync({
        id: formState.id,
        payload: getDirtyPayload(selectedRow || {}, payload),
      });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (selectedRow?.id) {
      await deleteMutation.mutateAsync(String(selectedRow.id));
      setIsDeleteOpen(false);
    }
  };

  return (
    <RxPage
      title="Broadcasts"
      description="Manage mass communication campaigns"
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Broadcast
        </Button>
      }
    >
      <PaginatedDataTable
        rows={rows}
        columns={columns.map((col) => ({
          ...col,
          render:
            col.key === 'status'
              ? (value: any) => <Badge variant="light">{getString(value)}</Badge>
              : undefined,
        }))}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        actionCellProps={{
          actions: [
            { label: 'View JSON', onClick: openJson },
            { label: 'Edit', onClick: openEdit },
            { label: 'Delete', onClick: openDelete },
          ],
        }}
      />

      {/* FORM MODAL */}
      <Modal
        opened={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formState.id ? 'Edit Broadcast' : 'Create Broadcast'}
        size="lg"
      >
        <Stack>
          <TextInput
            label="Name"
            required
            value={formState.name}
            onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
          />

          <Textarea
            label="Description"
            value={formState.description}
            onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
          />

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Template ID"
                value={formState.messageTemplateId}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    messageTemplateId: e.target.value,
                  }))
                }
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <SelectField
                label="Status"
                options={BROADCAST_STATUS_OPTIONS}
                value={formState.status}
                onChange={(value) => setFormState((p: any) => ({ ...p, status: value }))}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            type="datetime-local"
            label="Schedule"
            value={formState.scheduledAt}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                scheduledAt: e.target.value,
              }))
            }
          />

          <JsonEditorField
            label="Recipient Criteria"
            value={formState.recipientCriteria}
            onChange={(v) => setFormState((p) => ({ ...p, recipientCriteria: v }))}
          />

          <JsonEditorField
            label="Metadata"
            value={formState.metadata}
            onChange={(v) => setFormState((p) => ({ ...p, metadata: v }))}
          />

          <DialogActions
            onSave={handleSave}
            onCancel={() => setIsFormOpen(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </Stack>
      </Modal>

      {/* JSON */}
      <JsonPreviewDialog
        data={selectedRow || {}}
        open={isJsonOpen}
        onOpenChange={setIsJsonOpen}
        title="Broadcast JSON"
      />

      {/* DELETE */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Broadcast"
        desc="This cannot be undone"
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </RxPage>
  );
}
