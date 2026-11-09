import { Button, Modal, TextInput, Textarea, Group, Stack, Checkbox, Select } from '@mantine/core';
import { Braces, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { JsonEditorField } from '@/components/form/json-editor-field';
import { RxPage } from '@/components/page/rx-page';
import { PaginatedDataTable } from '@/components/table/paginated-data-table';
import { NOTIFICATION_TYPE_OPTIONS } from '../types/constants';
import {
  CommunicationRow,
  DialogActions,
  JsonPreviewDialog,
  LabelField,
  getDirtyPayload,
  getObject,
  getString,
  normalizeRows,
  useCommunicationCrud,
  useCommunicationList,
} from './shared';

type NotificationFormState = {
  id?: string;
  title: string;
  message: string;
  type: string;
  recipientIds: string[];
  isBroadcast: boolean;
  scheduledAt: string;
  expiresAt: string;
  priority: string;
  metadata: Record<string, unknown>;
};

const defaultFormState: NotificationFormState = {
  title: '',
  message: '',
  type: 'info',
  recipientIds: [],
  isBroadcast: false,
  scheduledAt: '',
  expiresAt: '',
  priority: 'normal',
  metadata: {},
};

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'title', label: 'Title', width: '200px' },
  { key: 'type', label: 'Type', width: '100px' },
  { key: 'isBroadcast', label: 'Broadcast', width: '100px' },
  { key: 'priority', label: 'Priority', width: '100px' },
  { key: 'createdAt', label: 'Created', width: '150px' },
  { key: 'scheduledAt', label: 'Scheduled', width: '150px' },
];

export function NotificationsPage() {
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<CommunicationRow | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [formState, setFormState] = useState<NotificationFormState>(defaultFormState);

  const { data: notifications = [], isLoading } = useCommunicationList('notifications', search);

  const { createMutation, updateMutation, deleteMutation } = useCommunicationCrud('notifications');

  const normalizedRows = useMemo(() => normalizeRows(notifications), [notifications]);

  const handleCreate = () => {
    setFormState(defaultFormState);
    setIsCreateOpen(true);
  };

  const handleEdit = (row: CommunicationRow) => {
    setSelectedRow(row);

    setFormState({
      id: getString(row.id),
      title: getString(row.title),
      message: getString(row.message),
      type: getString(row.type),
      recipientIds: Array.isArray(row.recipientIds) ? row.recipientIds.map(String) : [],
      isBroadcast: Boolean(row.isBroadcast),
      scheduledAt: getString(row.scheduledAt),
      expiresAt: getString(row.expiresAt),
      priority: getString(row.priority),
      metadata: getObject(row.metadata),
    });

    setIsEditOpen(true);
  };

  const handleViewJson = (row: CommunicationRow) => {
    setSelectedRow(row);
    setIsJsonOpen(true);
  };

  const handleDelete = (row: CommunicationRow) => {
    setSelectedRow(row);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    const payload: any = { ...formState };
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
  };

  const handleConfirmDelete = async () => {
    if (selectedRow?.id) {
      await deleteMutation.mutateAsync(String(selectedRow.id));
      setIsDeleteOpen(false);
    }
  };

  const actions = [
    { label: 'View JSON', icon: Braces, onClick: handleViewJson },
    { label: 'Edit', icon: Pencil, onClick: handleEdit },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleDelete,
      variant: 'destructive' as const,
    },
  ];

  return (
    <RxPage
      title="Notifications"
      description="Manage system notifications and alerts"
      actions={
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Notification
        </Button>
      }
    >
      <PaginatedDataTable
        rows={normalizedRows}
        columns={columns}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        // actions={actions}
        // keyExtractor={(row) => row.id}
      />

      {/* CREATE MODAL */}
      <Modal
        opened={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Notification"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Title"
            value={formState.title}
            onChange={(e) => setFormState((p) => ({ ...p, title: e.target.value }))}
          />

          <Textarea
            label="Message"
            value={formState.message}
            onChange={(e) => setFormState((p) => ({ ...p, message: e.target.value }))}
          />

          <Group grow>
            <Select
              label="Type"
              data={NOTIFICATION_TYPE_OPTIONS}
              value={formState.type}
              onChange={(v) => setFormState((p) => ({ ...p, type: v || 'info' }))}
            />

            <Select
              label="Priority"
              data={[
                { value: 'low', label: 'Low' },
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
              value={formState.priority}
              onChange={(v) => setFormState((p) => ({ ...p, priority: v || 'normal' }))}
            />
          </Group>

          <Checkbox
            label="Broadcast to all users"
            checked={formState.isBroadcast}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                isBroadcast: e.currentTarget.checked,
              }))
            }
          />

          <Group grow>
            <TextInput
              label="Scheduled At"
              type="datetime-local"
              value={formState.scheduledAt}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  scheduledAt: e.target.value,
                }))
              }
            />

            <TextInput
              label="Expires At"
              type="datetime-local"
              value={formState.expiresAt}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  expiresAt: e.target.value,
                }))
              }
            />
          </Group>

          <JsonEditorField
            label="Metadata"
            value={formState.metadata}
            onChange={(v) =>
              setFormState((p) => ({
                ...p,
                metadata: v as Record<string, unknown>,
              }))
            }
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={createMutation.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        opened={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Notification"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Title"
            value={formState.title}
            onChange={(e) => setFormState((p) => ({ ...p, title: e.target.value }))}
          />

          <Textarea
            label="Message"
            value={formState.message}
            onChange={(e) => setFormState((p) => ({ ...p, message: e.target.value }))}
          />

          <Group grow>
            <Select
              label="Type"
              data={NOTIFICATION_TYPE_OPTIONS}
              value={formState.type}
              onChange={(v) => setFormState((p) => ({ ...p, type: v || 'info' }))}
            />

            <Select
              label="Priority"
              data={[
                { value: 'low', label: 'Low' },
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
              value={formState.priority}
              onChange={(v) => setFormState((p) => ({ ...p, priority: v || 'normal' }))}
            />
          </Group>

          <Checkbox
            label="Broadcast to all users"
            checked={formState.isBroadcast}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                isBroadcast: e.currentTarget.checked,
              }))
            }
          />

          <Group grow>
            <TextInput
              label="Scheduled At"
              type="datetime-local"
              value={formState.scheduledAt}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  scheduledAt: e.target.value,
                }))
              }
            />

            <TextInput
              label="Expires At"
              type="datetime-local"
              value={formState.expiresAt}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  expiresAt: e.target.value,
                }))
              }
            />
          </Group>

          <JsonEditorField
            label="Metadata"
            value={formState.metadata}
            onChange={(v) =>
              setFormState((p) => ({
                ...p,
                metadata: v as Record<string, unknown>,
              }))
            }
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={updateMutation.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* JSON */}
      <JsonPreviewDialog
        data={selectedRow || {}}
        title="Notification JSON"
        open={isJsonOpen}
        onOpenChange={setIsJsonOpen}
      />

      {/* DELETE */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Notification"
        description="Are you sure you want to delete this notification?"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </RxPage>
  );
}
