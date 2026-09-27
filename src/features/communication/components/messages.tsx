import {
  Button,
  Modal,
  TextInput,
  Textarea,
  Select,
  Stack,
  Grid,
  Group,
  Checkbox,
  Text,
  Title,
} from '@mantine/core';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { JsonEditorField } from '@/features/components/form/json-editor-field';
import { SelectField } from '@/features/components/form/select';
import { RxPage } from '@/features/components/page/rx-page';
import { PaginatedDataTable } from '@/features/components/table/paginated-data-table';
import { Option } from '@/features/rxsoft/types';
import {
  MESSAGE_TYPE_OPTIONS,
  MESSAGE_STATUS_OPTIONS,
  MESSAGE_PRIORITY_OPTIONS,
} from '../types/constants';
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

type MessageFormState = {
  id?: string;
  recipientId: string;
  recipientEmail: string;
  recipientPhone: string;
  channelId: string;
  templateId: string;
  messageType: Option;
  subject: string;
  content: string;
  priority: Option;
  status: string;
  scheduledAt: string;
  metadata: Record<string, unknown>;
};

const defaultFormState: MessageFormState = {
  recipientId: '',
  recipientEmail: '',
  recipientPhone: '',
  channelId: '',
  templateId: '',
  messageType: getOption('text'),
  subject: '',
  content: '',
  priority: getOption('normal'),
  status: 'draft',
  scheduledAt: '',
  metadata: {},
};

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'recipientEmail', label: 'Recipient', width: '200px' },
  { key: 'messageType', label: 'Type', width: '100px' },
  { key: 'subject', label: 'Subject', width: '200px' },
  { key: 'priority', label: 'Priority', width: '100px' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'createdAt', label: 'Created', width: '150px' },
];

export function MessagesPage() {
  const [search, setSearch] = useState('');
  const [selectedRow] = useState<CommunicationRow | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [formState, setFormState] = useState<MessageFormState>(defaultFormState);

  const { data: messages = [], isLoading } = useCommunicationList('messages', search);

  const { createMutation, updateMutation, deleteMutation } = useCommunicationCrud('messages');

  const rows = useMemo(() => normalizeRows(messages), [messages]);

  const handleCreate = () => {
    setFormState(defaultFormState);
    setIsCreateOpen(true);
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

    setIsCreateOpen(false);
    setIsEditOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedRow?.id) {
      return;
    }
    await deleteMutation.mutateAsync(String(selectedRow.id));
    setIsDeleteOpen(false);
  };

  return (
    <RxPage
      title="Messages"
      description="Manage individual messages and communications"
      actions={
        <Button onClick={handleCreate} leftSection={<Plus size={16} />}>
          New Message
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

      {/* CREATE MODAL */}
      <Modal
        opened={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={<Title order={4}>Create Message</Title>}
        size="lg"
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Recipient Email"
                value={formState.recipientEmail}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    recipientEmail: e.target.value,
                  }))
                }
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Recipient Phone"
                value={formState.recipientPhone}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    recipientPhone: e.target.value,
                  }))
                }
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <SelectField
                label="Message Type"
                options={MESSAGE_TYPE_OPTIONS}
                value={formState.messageType}
                onChange={(v) => setFormState((p: any) => ({ ...p, messageType: v }))}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <SelectField
                label="Priority"
                options={MESSAGE_PRIORITY_OPTIONS}
                value={formState.priority}
                onChange={(v) => setFormState((p: any) => ({ ...p, priority: v }))}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Subject"
            value={formState.subject}
            onChange={(e) => setFormState((p) => ({ ...p, subject: e.target.value }))}
          />

          <Textarea
            label="Content"
            minRows={4}
            value={formState.content}
            onChange={(e) => setFormState((p) => ({ ...p, content: e.target.value }))}
          />

          <TextInput
            label="Schedule Send"
            type="datetime-local"
            value={formState.scheduledAt}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                scheduledAt: e.target.value,
              }))
            }
          />

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
        title={<Title order={4}>Edit Message</Title>}
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Recipient Email"
            value={formState.recipientEmail}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                recipientEmail: e.target.value,
              }))
            }
          />

          <TextInput
            label="Subject"
            value={formState.subject}
            onChange={(e) => setFormState((p) => ({ ...p, subject: e.target.value }))}
          />

          <Textarea
            label="Content"
            minRows={4}
            value={formState.content}
            onChange={(e) => setFormState((p) => ({ ...p, content: e.target.value }))}
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

      {/* JSON + DELETE remain unchanged */}
      <JsonPreviewDialog
        data={selectedRow || {}}
        title="Message JSON"
        open={isJsonOpen}
        onOpenChange={setIsJsonOpen}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Message"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </RxPage>
  );
}
