import {
  ActionIcon,
  Badge,
  Button,
  Grid,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { RxPage } from '@/features/components/page/rx-page';
import { PaginatedDataTable } from '@/features/components/table/paginated-data-table';
import {
  useChannelCodeOptions,
  useMessageTemplateMutations,
  useMessageTemplates,
} from '../../../notifications/use-message-templates';
import {
  CONTENT_TYPE_OPTIONS,
  DEFAULT_MESSAGE_TEMPLATE,
  DESTINATION_OPTIONS,
  TEMPLATE_STATUS_OPTIONS,
  normalizeMessageTemplate,
  toMessageTemplateInput,
  type MessageTemplate,
  type MessageTemplateInput,
} from '../../../notifications/types';

type TemplateFormState = MessageTemplateInput & { id?: string };

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  draft: 'gray',
  inactive: 'red',
};

function toFormState(template: MessageTemplate): TemplateFormState {
  return { ...toMessageTemplateInput(template), id: template.id };
}

export function MessageTemplatesPage() {
  const [search, setSearch] = useState('');
  const [formState, setFormState] = useState<TemplateFormState>({ ...DEFAULT_MESSAGE_TEMPLATE });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: templates = [], isLoading, isError } = useMessageTemplates(search);
  const { data: channelOptions = [] } = useChannelCodeOptions();
  const { createMutation, updateMutation, deleteMutation } = useMessageTemplateMutations();

  const channelData = useMemo(() => {
    const known = new Map(channelOptions.map((option) => [option.value, option]));
    for (const code of formState.channel_codes) {
      if (!known.has(code)) {
        known.set(code, { value: code, label: code });
      }
    }
    return [...known.values()];
  }, [channelOptions, formState.channel_codes]);

  const isValid = formState.code.trim() && formState.name.trim() && formState.content.trim();
  const isLimitedText = formState.content_type === 'limited_text';
  const exceedsMax =
    isLimitedText &&
    typeof formState.max_characters === 'number' &&
    formState.content.length > formState.max_characters;

  const openCreate = () => {
    setFormState({ ...DEFAULT_MESSAGE_TEMPLATE });
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (template: MessageTemplate) => {
    setFormState(toFormState(template));
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!isValid) {
      setFormError('Code, name and content are required.');
      return;
    }
    if (exceedsMax) {
      setFormError('Content exceeds the maximum character limit.');
      return;
    }
    const payload: MessageTemplateInput = {
      ...formState,
      max_characters: isLimitedText ? formState.max_characters : null,
    };
    delete (payload as TemplateFormState).id;
    try {
      if (formState.id) {
        await updateMutation.mutateAsync({ id: formState.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsFormOpen(false);
    } catch {
      setFormError('Could not save the template.');
    }
  };

  const handleDelete = async () => {
    if (!formState.id) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(formState.id);
      setIsDeleteOpen(false);
    } catch {
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'content_type', label: 'Content type' },
    {
      key: 'destinations',
      label: 'Destinations',
      render: (row: Record<string, unknown>) => {
        const destinations = normalizeMessageTemplate(row).destinations;
        return destinations.length ? destinations.join(', ') : '—';
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = String(row.status ?? 'draft');
        return (
          <Badge color={STATUS_COLORS[status] ?? 'gray'} variant="light">
            {status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (row: Record<string, unknown>) => (
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            aria-label="Edit template"
            onClick={() => openEdit(normalizeMessageTemplate(row))}
          >
            <Pencil size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label="Delete template"
            onClick={() => {
              setFormState(toFormState(normalizeMessageTemplate(row)));
              setIsDeleteOpen(true);
            }}
          >
            <Trash2 size={16} />
          </ActionIcon>
        </Group>
      ),
    },
  ];

  return (
    <RxPage
      title="Message Templates"
      description="Configure notification message templates and delivery settings."
      actions={
        <Button onClick={openCreate} leftSection={<Plus size={16} />}>
          New template
        </Button>
      }
    >
      <PaginatedDataTable
        columns={columns}
        rows={templates as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        isError={isError}
        searchValue={search}
        onSearchChange={setSearch}
      />

      <Modal
        opened={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formState.id ? 'Edit message template' : 'Create message template'}
        size="lg"
      >
        <Stack>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Code"
                required
                value={formState.code}
                onChange={(e) => setFormState((prev) => ({ ...prev, code: e.target.value }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Name"
                required
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Content type"
                data={CONTENT_TYPE_OPTIONS}
                value={formState.content_type}
                onChange={(value) =>
                  setFormState((prev) => ({ ...prev, content_type: value ?? 'free_text' }))
                }
                allowDeselect={false}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Status"
                data={TEMPLATE_STATUS_OPTIONS}
                value={formState.status}
                onChange={(value) => setFormState((prev) => ({ ...prev, status: value ?? 'draft' }))}
                allowDeselect={false}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Content"
            required
            autosize
            minRows={4}
            maxRows={12}
            value={formState.content}
            maxLength={
              isLimitedText && typeof formState.max_characters === 'number'
                ? formState.max_characters
                : undefined
            }
            error={exceedsMax ? 'Content exceeds the maximum character limit.' : undefined}
            onChange={(e) => setFormState((prev) => ({ ...prev, content: e.target.value }))}
          />
          <Text size="xs" c={exceedsMax ? 'red' : 'dimmed'}>
            {formState.content.length}
            {isLimitedText && typeof formState.max_characters === 'number'
              ? ` / ${formState.max_characters}`
              : ''}{' '}
            characters
          </Text>

          {isLimitedText && (
            <NumberInput
              label="Max characters"
              min={1}
              value={formState.max_characters ?? ''}
              onChange={(value) =>
                setFormState((prev) => ({
                  ...prev,
                  max_characters: typeof value === 'number' ? value : null,
                }))
              }
            />
          )}

          <MultiSelect
            label="Destinations"
            data={DESTINATION_OPTIONS}
            value={formState.destinations}
            onChange={(value) => setFormState((prev) => ({ ...prev, destinations: value }))}
            searchable
            hidePickedOptions
          />

          <MultiSelect
            label="Channel codes"
            data={channelData}
            value={formState.channel_codes}
            onChange={(value) => setFormState((prev) => ({ ...prev, channel_codes: value }))}
            searchable
            hidePickedOptions
            nothingFoundMessage="No channels found"
          />

          <Grid>
            <Grid.Col span={4}>
              <NumberInput
                label="Heartbeat retries"
                min={0}
                value={formState.heartbeat_retries}
                onChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    heartbeat_retries: typeof value === 'number' ? value : 0,
                  }))
                }
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Interval (seconds)"
                min={1}
                value={formState.heartbeat_interval_seconds}
                onChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    heartbeat_interval_seconds: typeof value === 'number' ? value : 0,
                  }))
                }
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Expiry (seconds)"
                min={1}
                value={formState.heartbeat_expiry_seconds}
                onChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    heartbeat_expiry_seconds: typeof value === 'number' ? value : 0,
                  }))
                }
              />
            </Grid.Col>
          </Grid>

          {formError && (
            <Text size="sm" c="red">
              {formError}
            </Text>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsFormOpen(false)}>
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

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete message template"
        desc={`Delete "${formState.name}"? This cannot be undone.`}
        confirmText="Delete"
        destructive
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </RxPage>
  );
}
