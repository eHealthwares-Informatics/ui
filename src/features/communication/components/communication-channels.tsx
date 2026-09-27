import { Button, Modal, TextInput, Textarea, Stack, Grid, Checkbox, Group } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { JsonEditorField } from '@/features/components/form/json-editor-field';
import { SelectField } from '@/features/components/form/select';
import { RxPage } from '@/features/components/page/rx-page';
import { PaginatedDataTable } from '@/features/components/table/paginated-data-table';
import { Option } from '@/features/rxsoft/types';
import { CHANNEL_TYPE_OPTIONS } from '../types/constants';
import {
  DialogActions,
  JsonPreviewDialog,
  LabelField,
  getDirtyPayload,
  normalizeRows,
  useCommunicationCrud,
  useCommunicationList,
  CommunicationRow,
  getOption,
} from './shared';

type CommunicationChannelFormState = {
  id?: string;
  name: string;
  description: string;
  type: Option;
  provider: string;
  config: Record<string, unknown>;
  isActive: boolean;
  priority: number;
  rateLimit: number;
  metadata: Record<string, unknown>;
};

const defaultFormState: CommunicationChannelFormState = {
  name: '',
  description: '',
  type: getOption('email'),
  provider: '',
  config: {},
  isActive: true,
  priority: 1,
  rateLimit: 100,
  metadata: {},
};

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'name', label: 'Name', width: '200px' },
  { key: 'type', label: 'Type', width: '120px' },
  { key: 'provider', label: 'Provider', width: '150px' },
  { key: 'isActive', label: 'Active', width: '100px' },
  { key: 'priority', label: 'Priority', width: '100px' },
  { key: 'createdAt', label: 'Created', width: '150px' },
];

export function CommunicationChannelsPage() {
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<CommunicationRow | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [formState, setFormState] = useState<CommunicationChannelFormState>(defaultFormState);

  const { data: channels = [], isLoading } = useCommunicationList('communication-channels', search);

  const { createMutation, updateMutation, deleteMutation } =
    useCommunicationCrud('communication-channels');

  const rows = useMemo(() => normalizeRows(channels), [channels]);

  function openCreate() {
    setSelectedRow(null);
    setFormState(defaultFormState);
    setIsCreateOpen(true);
  }

  function openEdit(row: CommunicationRow) {
    setSelectedRow(row);
    setFormState({
      id: String(row.id),
      name: String(row.name ?? ''),
      description: String(row.description ?? ''),
      type: getOption(row.type ?? 'email'),
      provider: String(row.provider ?? ''),
      config: (row.config as Record<string, unknown>) ?? {},
      isActive: Boolean(row.isActive),
      priority: Number(row.priority ?? 1),
      rateLimit: Number(row.rateLimit ?? 100),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    });
    setIsEditOpen(true);
  }

  async function handleSave() {
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

    setIsCreateOpen(false);
    setIsEditOpen(false);
  }

  async function handleDelete() {
    if (!selectedRow?.id) {
      return;
    }
    await deleteMutation.mutateAsync(String(selectedRow.id));
    setIsDeleteOpen(false);
  }

  return (
    <RxPage
      title="Communication Channels"
      description="Manage communication channels and providers"
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Channel
        </Button>
      }
    >
      <PaginatedDataTable
        rows={rows}
        columns={columns}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* CREATE / EDIT MODAL */}
      <Modal
        opened={isCreateOpen || isEditOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setIsEditOpen(false);
        }}
        title={isEditOpen ? 'Edit Channel' : 'Create Channel'}
        size="lg"
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Name"
                value={formState.name}
                onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <SelectField
                label="Type"
                options={CHANNEL_TYPE_OPTIONS}
                value={formState.type}
                onChange={(value: any) => setFormState((p) => ({ ...p, type: value }))}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Description"
            value={formState.description}
            onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
          />

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Provider"
                value={formState.provider}
                onChange={(e) => setFormState((p) => ({ ...p, provider: e.target.value }))}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Checkbox
                label="Active"
                checked={formState.isActive}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    isActive: e.currentTarget.checked,
                  }))
                }
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Priority"
                type="number"
                value={formState.priority}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    priority: Number(e.target.value) || 1,
                  }))
                }
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Rate Limit"
                type="number"
                value={formState.rateLimit}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    rateLimit: Number(e.target.value) || 100,
                  }))
                }
              />
            </Grid.Col>
          </Grid>

          <JsonEditorField
            label="Config"
            value={formState.config}
            onChange={(value) => setFormState((p) => ({ ...p, config: value as any }))}
          />

          <JsonEditorField
            label="Metadata"
            value={formState.metadata}
            onChange={(value) => setFormState((p) => ({ ...p, metadata: value as any }))}
          />

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* JSON */}
      <JsonPreviewDialog
        data={selectedRow || {}}
        title="Channel JSON"
        open={isJsonOpen}
        onOpenChange={setIsJsonOpen}
      />

      {/* DELETE */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Channel"
        desc="This action cannot be undone"
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </RxPage>
  );
}
