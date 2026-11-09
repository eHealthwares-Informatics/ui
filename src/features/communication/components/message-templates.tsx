import {
  Button,
  Modal,
  TextInput,
  Textarea,
  Checkbox,
  Grid,
  Stack,
  Group,
  Select,
} from '@mantine/core';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { JsonEditorField } from '@/components/form/json-editor-field';
import { RxPage } from '@/components/page/rx-page';
import { PaginatedDataTable } from '@/components/table/paginated-data-table';
import { TEMPLATE_TYPE_OPTIONS, MESSAGE_TYPE_OPTIONS } from '../types/constants';
import {
  DialogActions,
  JsonPreviewDialog,
  getDirtyPayload,
  normalizeRows,
  getString,
  useCommunicationCrud,
  useCommunicationList,
  CommunicationRow,
} from './shared';

type MessageTemplateFormState = {
  id?: string;
  name: string;
  description: string;
  templateType: string;
  messageType: string;
  subject: string;
  content: string;
  variables: Record<string, unknown>;
  isActive: boolean;
  metadata: Record<string, unknown> | unknown[];
};

const defaultFormState: MessageTemplateFormState = {
  name: '',
  description: '',
  templateType: 'message',
  messageType: 'text',
  subject: '',
  content: '',
  variables: {},
  isActive: true,
  metadata: {},
};

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'templateType', label: 'Type' },
  { key: 'messageType', label: 'Message Type' },
  { key: 'isActive', label: 'Active' },
  { key: 'createdAt', label: 'Created' },
];

export function MessageTemplatesPage() {
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<CommunicationRow | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [formState, setFormState] = useState<MessageTemplateFormState>(defaultFormState);

  const { data: templates = [], isLoading } = useCommunicationList('message-templates', search);

  const { createMutation, updateMutation, deleteMutation } =
    useCommunicationCrud('message-templates');

  const rows = useMemo(() => normalizeRows(templates), [templates]);

  /* ---------------- ACTIONS ---------------- */

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
      templateType: getString(row.templateType) || 'message',
      messageType: getString(row.messageType) || 'text',
      subject: getString(row.subject),
      content: getString(row.content),
      variables: (row.variables as Record<string, unknown>) ?? {},
      isActive: Boolean(row.isActive),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    });

    setIsFormOpen(true);
  };

  const openJson = (row: CommunicationRow) => {
    setSelectedRow(row);
    setIsJsonOpen(true);
  };

  const openDelete = (row: CommunicationRow) => {
    setSelectedRow(row);
    setIsDeleteOpen(true);
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

  /* ---------------- UI ---------------- */

  return (
    <RxPage
      title="Message Templates"
      description="Manage reusable message templates"
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
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
        // actions={[
        //   { label: 'View JSON', onClick: openJson },
        //   { label: 'Edit', onClick: openEdit },
        //   { label: 'Delete', onClick: openDelete },
        // ]}
      />

      {/* FORM */}
      <Modal
        opened={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formState.id ? 'Edit Template' : 'Create Template'}
        size="lg"
      >
        <Stack>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Name"
                required
                value={formState.name}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    name: e.target.value,
                  }))
                }
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label="Template Type"
                data={TEMPLATE_TYPE_OPTIONS}
                value={formState.templateType}
                onChange={(v) =>
                  setFormState((p) => ({
                    ...p,
                    templateType: v || '',
                  }))
                }
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Description"
            value={formState.description}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                description: e.target.value,
              }))
            }
          />

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Message Type"
                data={MESSAGE_TYPE_OPTIONS}
                value={formState.messageType}
                onChange={(v) =>
                  setFormState((p) => ({
                    ...p,
                    messageType: v || '',
                  }))
                }
              />
            </Grid.Col>

            <Grid.Col span={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
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

          <TextInput
            label="Subject"
            value={formState.subject}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                subject: e.target.value,
              }))
            }
          />

          <Textarea
            label="Content"
            required
            rows={6}
            value={formState.content}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                content: e.target.value,
              }))
            }
          />

          <JsonEditorField
            label="Variables"
            value={formState.variables}
            onChange={(v) => setFormState((p: any) => ({ ...p, variables: v }))}
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
        title="Message Template JSON"
      />

      {/* DELETE */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Template"
        desc="This cannot be undone"
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </RxPage>
  );
}
