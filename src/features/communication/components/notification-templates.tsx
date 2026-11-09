import {
  Button,
  Modal,
  TextInput,
  Textarea,
  Stack,
  Grid,
  Group,
  Text,
  Switch,
} from '@mantine/core';
import { Braces, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { JsonEditorField } from '@/components/form/json-editor-field';
import { SelectField } from '@/components/form/select';
import { RxPage } from '@/components/page/rx-page';
import { PaginatedDataTable } from '@/components/table/paginated-data-table';
import { Option } from '@/features/rxsoft/types';
import { NOTIFICATION_TYPE_OPTIONS } from '../types/constants';
import {
  CommunicationRow,
  JsonPreviewDialog,
  getDirtyPayload,
  getObject,
  getOption,
  getString,
  normalizeRows,
  useCommunicationCrud,
  useCommunicationList,
} from './shared';

type NotificationTemplateFormState = {
  id?: string;
  name: string;
  description: string;
  type: Option;
  title: string;
  message: string;
  actionUrl: string;
  actionText: string;
  variables: Record<string, unknown> | unknown[];
  isActive: boolean;
  metadata: Record<string, unknown> | unknown[];
};

const defaultFormState: NotificationTemplateFormState = {
  name: '',
  description: '',
  type: getOption('info'),
  title: '',
  message: '',
  actionUrl: '',
  actionText: '',
  variables: {},
  isActive: true,
  metadata: {},
};

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'name', label: 'Name', width: '200px' },
  { key: 'type', label: 'Type', width: '120px' },
  { key: 'title', label: 'Title', width: '200px' },
  { key: 'isActive', label: 'Active', width: '100px' },
  { key: 'createdAt', label: 'Created', width: '150px' },
  { key: 'updatedAt', label: 'Updated', width: '150px' },
];

export function NotificationTemplatesPage() {
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<CommunicationRow | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [form, setForm] = useState<NotificationTemplateFormState>(defaultFormState);

  const { data: templates = [], isLoading } = useCommunicationList(
    'notification-templates',
    search
  );
  const { createMutation, updateMutation, deleteMutation } =
    useCommunicationCrud('notification-templates');

  const rows = useMemo(() => normalizeRows(templates), [templates]);

  function openCreate() {
    setForm(defaultFormState);
    setCreateOpen(true);
  }

  function openEdit(row: CommunicationRow) {
    setSelectedRow(row);
    setForm({
      id: getString(row.id),
      name: getString(row.name),
      description: getString(row.description),
      type: getOption(row.type),
      title: getString(row.title),
      message: getString(row.message),
      actionUrl: getString(row.actionUrl),
      actionText: getString(row.actionText),
      variables: getObject(row.variables),
      isActive: Boolean(row.isActive),
      metadata: getObject(row.metadata),
    });
    setEditOpen(true);
  }

  function openJson(row: CommunicationRow) {
    setSelectedRow(row);
    setJsonOpen(true);
  }

  function openDelete(row: CommunicationRow) {
    setSelectedRow(row);
    setDeleteOpen(true);
  }

  async function handleSave() {
    const payload = { ...form };
    delete payload.id;

    if (form.id) {
      await updateMutation.mutateAsync({
        id: form.id,
        payload: getDirtyPayload(selectedRow || {}, payload),
      });
      setEditOpen(false);
    } else {
      await createMutation.mutateAsync(payload);
      setCreateOpen(false);
    }
  }

  async function confirmDelete() {
    if (selectedRow?.id) {
      await deleteMutation.mutateAsync(String(selectedRow.id));
      setDeleteOpen(false);
    }
  }

  const actions = [
    { label: 'View JSON', icon: Braces, onClick: openJson },
    { label: 'Edit', icon: Pencil, onClick: openEdit },
    { label: 'Delete', icon: Trash2, onClick: openDelete, variant: 'destructive' as const },
  ];

  function FormFields() {
    return (
      <Stack gap="md">
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.currentTarget.value }))}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <SelectField
              label="Type"
              options={NOTIFICATION_TYPE_OPTIONS}
              value={form.type}
              onChange={(value) => setForm((p: any) => ({ ...p, type: value }))}
            />
          </Grid.Col>
        </Grid>

        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.currentTarget.value }))}
        />

        <TextInput
          label="Title"
          required
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.currentTarget.value }))}
        />

        <Textarea
          label="Message"
          required
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.currentTarget.value }))}
        />

        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Action URL"
              value={form.actionUrl}
              onChange={(e) => setForm((p) => ({ ...p, actionUrl: e.currentTarget.value }))}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TextInput
              label="Action Text"
              value={form.actionText}
              onChange={(e) => setForm((p) => ({ ...p, actionText: e.currentTarget.value }))}
            />
          </Grid.Col>
        </Grid>

        <Switch
          label="Active"
          checked={form.isActive}
          onChange={(e) => setForm((p) => ({ ...p, isActive: e.currentTarget.checked }))}
        />

        <JsonEditorField
          label="Variables"
          value={form.variables}
          onChange={(v) => setForm((p) => ({ ...p, variables: v }))}
        />

        <JsonEditorField
          label="Metadata"
          value={form.metadata}
          onChange={(v) => setForm((p) => ({ ...p, metadata: v }))}
        />
      </Stack>
    );
  }

  return (
    <RxPage
      title="Notification Templates"
      description="Manage reusable notification templates"
      actions={
        <Button onClick={openCreate}>
          <Plus size={16} />
          New Template
        </Button>
      }
    >
      <PaginatedDataTable
        rows={rows}
        columns={columns}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        actionCellProps={{ actions }}
      />

      {/* Create */}
      <Modal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Template"
        size="lg"
      >
        <FormFields />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={createMutation.isPending}>
            Save
          </Button>
        </Group>
      </Modal>

      {/* Edit */}
      <Modal opened={editOpen} onClose={() => setEditOpen(false)} title="Edit Template" size="lg">
        <FormFields />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setEditOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={updateMutation.isPending}>
            Save
          </Button>
        </Group>
      </Modal>

      {/* JSON */}
      <JsonPreviewDialog
        data={selectedRow || {}}
        title="Notification Template JSON"
        open={jsonOpen}
        onOpenChange={setJsonOpen}
      />

      {/* Delete */}
      <Modal
        opened={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Template"
        centered
      >
        <Text size="sm" c="dimmed">
          Are you sure you want to delete this template? This action cannot be undone.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button color="red" loading={deleteMutation.isPending} onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </RxPage>
  );
}
