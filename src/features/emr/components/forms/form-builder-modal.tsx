import {
  ActionIcon,
  Button,
  Card,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Copy, Folder, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react';
import { emrApi } from '@/lib/emr-api';
import { toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { FormDefinition, FormFieldType, FormSchema } from '../../lib/emr-types';
import { DynamicFormFields, type FormData } from '../documentation/dynamic-form';

const FIELD_TYPES: FormFieldType[] = [
  'text',
  'textarea',
  'number',
  'date',
  'datetime',
  'select',
  'radio',
  'checkbox',
  'checkbox-group',
  'table',
  'section',
  'tab',
  'col',
];

const TABLE_COLUMN_TYPES: FormFieldType[] = ['text', 'number', 'textarea', 'date', 'checkbox'];

type BuilderColumn = { key: string; label: string; type: FormFieldType };
type BuilderField = {
  /** Internal stable id used by drag-and-drop; stripped when the schema is exported. */
  uid: string;
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  optionsText: string;
  placeholder: string;
  defaultValue: string;
  columns: BuilderColumn[];
  fields: BuilderField[];
};

const CATEGORIES = ['CLINICAL_NOTE', 'VITALS', 'ASSESSMENT', 'SCREENING', 'PROCEDURE', 'OTHER'];

let uidCounter = 0;
function nextUid(): string {
  uidCounter += 1;
  return `f-${uidCounter}`;
}

function emptyField(): BuilderField {
  return {
    uid: nextUid(),
    key: '',
    label: '',
    type: 'text',
    required: false,
    optionsText: '',
    placeholder: '',
    defaultValue: '',
    columns: [],
    fields: [],
  };
}

/** Derive a camelCase key from a label, e.g. "Chief Complaint" -> chiefComplaint. */
function deriveKey(label: string): string {
  const words = label
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  return words
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');
}

/** Build a unique key among the given siblings (appends "Copy", "Copy2", ...). */
function uniqueKey(base: string, siblings: BuilderField[]): string {
  const existing = new Set(siblings.map((sibling) => sibling.key).filter(Boolean));
  if (base && !existing.has(base)) {
    return base;
  }
  let n = 1;
  let candidate = base ? `${base}Copy` : '';
  while (candidate && existing.has(candidate)) {
    n += 1;
    candidate = `${base}Copy${n}`;
  }
  return candidate;
}

/** Copy a field (and its nested fields) with fresh uids and a unique key. */
function duplicateField(field: BuilderField, siblings: BuilderField[]): BuilderField {
  const label = field.label ? `${field.label} (Copy)` : field.label;
  const baseKey = field.key || deriveKey(label);
  return {
    ...field,
    uid: nextUid(),
    key: uniqueKey(baseKey, siblings),
    label,
    fields: field.fields.map((child) => ({ ...child, uid: nextUid() })),
  };
}

function builderFieldToSchema(field: BuilderField): Record<string, unknown> {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    ...(field.required ? { required: true } : {}),
    ...(field.placeholder ? { placeholder: field.placeholder } : {}),
    ...(field.defaultValue ? { defaultValue: field.defaultValue } : {}),
    ...(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox-group'
      ? {
          options: field.optionsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
        }
      : {}),
    ...(field.type === 'table'
      ? {
          columns: field.columns.filter((column) => column.key.trim() && column.label.trim()),
        }
      : {}),
    ...(field.type === 'tab' || field.type === 'col'
      ? { fields: field.fields.map(builderFieldToSchema) }
      : {}),
  };
}

function builderToSchema(fields: BuilderField[]): FormSchema {
  return {
    fields: fields.map((field) => builderFieldToSchema(field) as FormSchema['fields'][number]),
  };
}

function schemaToBuilder(schema: FormSchema | undefined): BuilderField[] {
  const mapField = (field: NonNullable<FormSchema['fields']>[number]): BuilderField => ({
    uid: nextUid(),
    key: field.key,
    label: field.label,
    type: field.type,
    required: Boolean(field.required),
    optionsText: (field.options ?? []).join('\n'),
    placeholder: field.placeholder ?? '',
    defaultValue: field.defaultValue == null ? '' : String(field.defaultValue),
    columns:
      field.columns?.map((column) => ({
        key: column.key,
        label: column.label,
        type: column.type,
      })) ?? [],
    fields: field.fields ? field.fields.map(mapField) : [],
  });
  return (schema?.fields ?? []).map(mapField);
}

function validate(fields: BuilderField[], name: string, code: string, category: string): string[] {
  const errors: string[] = [];
  if (!name.trim()) {
    errors.push('Form name is required');
  }
  if (!code.trim()) {
    errors.push('Form code is required');
  }
  if (!category) {
    errors.push('Category is required');
  }

  const keys = new Set<string>();
  const walk = (list: BuilderField[], wherePrefix: string): void => {
    list.forEach((field, index) => {
      const where = wherePrefix ? `${wherePrefix} field ${index + 1}` : `Field ${index + 1}`;
      if (!field.label.trim()) {
        errors.push(`${where} is missing a label`);
      }
      const key = field.key.trim() || deriveKey(field.label);
      if (!key) {
        errors.push(`${where} is missing a key`);
      } else if (keys.has(key)) {
        errors.push(`Duplicate field key "${key}"`);
      } else {
        keys.add(key);
      }
      if (
        (field.type === 'select' || field.type === 'radio' || field.type === 'checkbox-group') &&
        field.optionsText.trim().split('\n').filter((line) => line.trim()).length === 0
      ) {
        errors.push(`${field.label || where} requires at least one option`);
      }
      if (
        field.type === 'table' &&
        field.columns.filter((c) => c.key.trim() && c.label.trim()).length === 0
      ) {
        errors.push(`${field.label || where} requires at least one column`);
      }
      if (field.type === 'tab' || field.type === 'col') {
        const kind = field.type === 'tab' ? 'Tab' : 'Column';
        const label = `"${field.label || key}"`;
        if (field.fields.length === 0) {
          errors.push(`${kind} ${label} requires at least one field`);
        }
        if (field.type === 'tab' && field.fields.some((child) => child.type === 'tab')) {
          errors.push(`Tab ${label} cannot contain nested tabs`);
        }
        if (field.type === 'col' && field.fields.some((child) => child.type === 'tab' || child.type === 'col')) {
          errors.push(`Column ${label} can only contain fields or sections`);
        }
        walk(field.fields, `${kind} ${label}`);
      }
    });
  };
  walk(fields, '');
  return errors;
}

/** Sortable wrapper: renders each item with a stable dnd id and drag handle props. */
function SortableFieldList({
  fields,
  onReorder,
  children,
}: {
  fields: BuilderField[];
  onReorder: (next: BuilderField[]) => void;
  children: (renderProps: {
    field: BuilderField;
    index: number;
    dragHandleProps: HTMLAttributes<HTMLElement>;
  }) => ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = fields.findIndex((field) => field.uid === active.id);
    const to = fields.findIndex((field) => field.uid === over.id);
    if (from < 0 || to < 0) {
      return;
    }
    onReorder(arrayMove(fields, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map((field) => field.uid)} strategy={verticalListSortingStrategy}>
        {fields.map((field, index) => (
          <SortableFieldItem key={field.uid} id={field.uid}>
            {(dragHandleProps) => children({ field, index, dragHandleProps })}
          </SortableFieldItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableFieldItem({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: HTMLAttributes<HTMLElement>) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        ...(isDragging ? { opacity: 0.65, position: 'relative' as const, zIndex: 20 } : {}),
      }}
    >
      {children({ ...attributes, ...listeners } as HTMLAttributes<HTMLElement>)}
    </div>
  );
}

function FieldEditor({
  field,
  onChange,
  onRemove,
  onDuplicate,
  canMoveUp,
  canMoveDown,
  onMove,
  dragHandleProps,
}: {
  field: BuilderField;
  onChange: (next: BuilderField) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  dragHandleProps: HTMLAttributes<HTMLElement>;
}) {
  const patch = (next: Partial<BuilderField>) => onChange({ ...field, ...next });
  const children = field.fields ?? [];
  const isContainer = field.type === 'section' || field.type === 'tab' || field.type === 'col';
  const optionsField =
    field.type === 'select' || field.type === 'radio' || field.type === 'checkbox-group';
  const columnsField = field.type === 'table';

  const updateChild = (index: number, next: BuilderField) =>
    patch({ fields: children.map((child, i) => (i === index ? next : child)) });
  const removeChild = (index: number) =>
    patch({ fields: children.filter((_, i) => i !== index) });
  const moveChild = (index: number, direction: -1 | 1) => {
    const next = [...children];
    const target = index + direction;
    if (target < 0 || target >= next.length) {
      return;
    }
    [next[index], next[target]] = [next[target], next[index]];
    patch({ fields: next });
  };

  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group gap="xs" align="flex-end" wrap="nowrap">
          <ActionIcon
            {...dragHandleProps}
            variant="subtle"
            aria-label="Drag to reorder"
            style={{ cursor: 'grab', marginBottom: 6 }}
          >
            <GripVertical size={15} />
          </ActionIcon>
          <Select
            label="Type"
            data={toSelectData(FIELD_TYPES)}
            value={field.type}
            onChange={(value) => patch({ type: (value as FormFieldType) ?? 'text' })}
            style={{ width: 150, flexShrink: 0 }}
          />
          <TextInput
            label="Label"
            placeholder="Field label"
            value={field.label}
            onChange={(e) => {
              const label = e.currentTarget.value;
              patch({
                label,
                ...(!field.key ? { key: deriveKey(label) } : {}),
              });
            }}
            style={{ flex: 2, minWidth: 140 }}
          />
          <TextInput
            label="Key"
            placeholder="fieldKey"
            value={field.key}
            onChange={(e) => patch({ key: e.currentTarget.value })}
            style={{ flex: 1, minWidth: 120 }}
          />
          {!isContainer && (
            <Checkbox
              label="Required"
              checked={field.required}
              onChange={(e) => patch({ required: e.currentTarget.checked })}
              mt={28}
            />
          )}
          <Group gap={2} mt={24}>
            <ActionIcon
              variant="subtle"
              disabled={!canMoveUp}
              onClick={() => onMove(-1)}
              aria-label="Move up"
            >
              <ArrowUp size={14} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              disabled={!canMoveDown}
              onClick={() => onMove(1)}
              aria-label="Move down"
            >
              <ArrowDown size={14} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              onClick={onDuplicate}
              aria-label="Duplicate field"
            >
              <Copy size={14} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={onRemove}
              aria-label="Remove field"
            >
              <Trash2 size={14} />
            </ActionIcon>
          </Group>
        </Group>

        {!isContainer && (
          <Group gap="xs" wrap="wrap">
            <TextInput
              label="Placeholder"
              size="xs"
              value={field.placeholder}
              onChange={(e) => patch({ placeholder: e.currentTarget.value })}
              style={{ flex: 1, minWidth: 140 }}
            />
            {(field.type === 'text' ||
              field.type === 'textarea' ||
              field.type === 'number' ||
              field.type === 'select') && (
              <TextInput
                label="Default value"
                size="xs"
                value={field.defaultValue}
                onChange={(e) => patch({ defaultValue: e.currentTarget.value })}
                style={{ flex: 1, minWidth: 140 }}
              />
            )}
          </Group>
        )}

        {optionsField && (
          <Textarea
            label="Options (one per line)"
            size="xs"
            autosize
            minRows={2}
            value={field.optionsText}
            onChange={(e) => patch({ optionsText: e.currentTarget.value })}
          />
        )}

        {columnsField && (
          <Stack gap={4}>
            <Text size="xs" fw={500}>
              Table columns
            </Text>
            {field.columns.map((column, columnIndex) => (
              <Group key={columnIndex} gap="xs" wrap="nowrap">
                <TextInput
                  size="xs"
                  placeholder="Key"
                  value={column.key}
                  onChange={(e) => {
                    const columns = [...field.columns];
                    columns[columnIndex] = { ...column, key: e.currentTarget.value };
                    patch({ columns });
                  }}
                  style={{ flex: 1, minWidth: 90 }}
                />
                <TextInput
                  size="xs"
                  placeholder="Label"
                  value={column.label}
                  onChange={(e) => {
                    const columns = [...field.columns];
                    columns[columnIndex] = { ...column, label: e.currentTarget.value };
                    patch({ columns });
                  }}
                  style={{ flex: 1, minWidth: 120 }}
                />
                <Select
                  size="xs"
                  data={toSelectData(TABLE_COLUMN_TYPES)}
                  value={column.type}
                  onChange={(value) => {
                    const columns = [...field.columns];
                    columns[columnIndex] = {
                      ...column,
                      type: (value as FormFieldType) ?? 'text',
                    };
                    patch({ columns });
                  }}
                  style={{ width: 120, flexShrink: 0 }}
                />
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() =>
                    patch({ columns: field.columns.filter((_, i) => i !== columnIndex) })
                  }
                  aria-label="Remove column"
                >
                  <Trash2 size={13} />
                </ActionIcon>
              </Group>
            ))}
            <Button
              size="compact-xs"
              variant="light"
              leftSection={<Plus size={13} />}
              onClick={() =>
                patch({ columns: [...field.columns, { key: '', label: '', type: 'text' }] })
              }
              style={{ alignSelf: 'flex-start' }}
            >
              Add column
            </Button>
          </Stack>
        )}

        {(field.type === 'tab' || field.type === 'col') && (
          <Stack gap="sm" pl="md" style={{ borderLeft: '3px solid var(--mantine-color-gray-3)' }}>
            <Group gap={6}>
              <Folder size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                {field.type === 'tab' ? 'Fields in this tab' : 'Fields in this column'} ({children.length})
              </Text>
            </Group>
            {children.length === 0 && (
              <Text size="xs" c="dimmed">
                {field.type === 'tab'
                  ? 'No fields yet — add fields to this tab below.'
                  : 'No fields yet — add fields to this column below.'}
              </Text>
            )}
            <SortableFieldList
              fields={children}
              onReorder={(next) => patch({ fields: next })}
            >
              {({ field: child, index: childIndex, dragHandleProps: childHandle }) => (
                <FieldEditor
                  key={child.uid}
                  field={child}
                  onChange={(next) => updateChild(childIndex, next)}
                  onRemove={() => removeChild(childIndex)}
                  onDuplicate={() =>
                    patch({
                      fields: [
                        ...children.slice(0, childIndex + 1),
                        duplicateField(child, children),
                        ...children.slice(childIndex + 1),
                      ],
                    })
                  }
                  canMoveUp={childIndex > 0}
                  canMoveDown={childIndex < children.length - 1}
                  onMove={(direction) => moveChild(childIndex, direction)}
                  dragHandleProps={childHandle}
                />
              )}
            </SortableFieldList>
            <Button
              size="compact-xs"
              variant="light"
              leftSection={<Plus size={13} />}
              onClick={() => patch({ fields: [...children, emptyField()] })}
              style={{ alignSelf: 'flex-start' }}
            >
              {field.type === 'tab' ? 'Add field to tab' : 'Add field to column'}
            </Button>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

export function FormBuilderModal({
  opened,
  onClose,
  onSaved,
  initial,
}: {
  opened: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initial?: FormDefinition | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(initial);
  const [tab, setTab] = useState<string | null>('fields');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [fields, setFields] = useState<BuilderField[]>([]);
  const [previewData, setPreviewData] = useState<FormData>({});
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonDirty, setJsonDirty] = useState(false);

  // Reset the builder from the initial definition each time the modal opens.
  useEffect(() => {
    if (!opened) {
      return;
    }
    setName(initial?.name ?? '');
    setCode(initial?.code ?? '');
    setDescription(initial?.description ?? '');
    setCategory(initial?.category ?? '');
    setFields(schemaToBuilder(initial?.schemaJson));
    setPreviewData({});
    setJsonDraft('');
    setJsonDirty(false);
    setTab('fields');
  }, [opened, initial]);

  // Keep the JSON view in sync with the visual editor until the user edits it.
  useEffect(() => {
    if (opened && tab === 'json' && !jsonDirty) {
      setJsonDraft(JSON.stringify(builderToSchema(fields), null, 2));
    }
  }, [opened, tab, fields, jsonDirty]);

  const schema = useMemo(() => builderToSchema(fields), [fields]);
  const previewSchemaFieldsCount = schema.fields.length;

  const setField = (index: number, patch: Partial<BuilderField>) => {
    setFields((current) =>
      current.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    );
  };

  const moveField = (index: number, direction: -1 | 1) => {
    setFields((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) {
        return current;
      }
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const errors = validate(fields, name, code, category);
      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        schemaJson: builderToSchema(fields),
      };
      if (isEdit && initial) {
        const { data } = await emrApi.patch(`/form-definitions/${initial.id}`, payload);
        return data;
      }
      const { data } = await emrApi.post('/form-definitions', { code: code.trim(), ...payload });
      return data;
    },
    onSuccess: () => {
      notifications.show({
        message: isEdit ? 'Form definition updated' : 'Form definition created (draft)',
        color: 'teal',
      });
      queryClient.invalidateQueries({ queryKey: ['emr', 'form-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'forms'] });
      onSaved?.();
      onClose();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? `Edit Form — ${initial?.name ?? ''}` : 'New Form Definition'}
      size="xl"
      centered
    >
      <Stack gap="md">
        {/* METADATA */}
        <Card withBorder radius="md" p="sm">
          <Group gap="sm" align="flex-end" wrap="wrap">
            <TextInput
              label="Name"
              required
              placeholder="e.g. Clinical Note"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              style={{ flex: 2, minWidth: 200 }}
            />
            <TextInput
              label="Code"
              required
              disabled={isEdit}
              placeholder="e.g. CLINICAL_NOTE"
              value={code}
              onChange={(e) => setCode(e.currentTarget.value.toUpperCase())}
              style={{ flex: 1, minWidth: 160 }}
            />
            <Select
              label="Category"
              required
              placeholder="Select category"
              data={toSelectData(CATEGORIES)}
              value={category}
              onChange={(value) => setCategory(value ?? '')}
              style={{ flex: 1, minWidth: 160 }}
            />
            <TextInput
              label="Description"
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              style={{ flex: 3, minWidth: 240 }}
            />
          </Group>
        </Card>

        <Tabs value={tab} onChange={setTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="fields">Fields ({fields.length})</Tabs.Tab>
            <Tabs.Tab value="preview">Preview</Tabs.Tab>
            <Tabs.Tab value="json">JSON</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="fields">
            <Stack gap="sm">
              {fields.length === 0 && (
                <Text size="sm" c="dimmed">
                  No fields yet — add your first field below. Use a Section field to group the
                  fields that follow it, or a Tab field to organize fields into tabs. Drag the
                  grip handle to reorder fields.
                </Text>
              )}

              <SortableFieldList fields={fields} onReorder={setFields}>
                {({ field, index, dragHandleProps }) => (
                  <FieldEditor
                    key={field.uid}
                    field={field}
                    onChange={(next) => setField(index, next)}
                    onRemove={() =>
                      setFields((current) => current.filter((_, i) => i !== index))
                    }
                    onDuplicate={() =>
                      setFields((current) => [
                        ...current.slice(0, index + 1),
                        duplicateField(field, current),
                        ...current.slice(index + 1),
                      ])
                    }
                    canMoveUp={index > 0}
                    canMoveDown={index < fields.length - 1}
                    onMove={(direction) => moveField(index, direction)}
                    dragHandleProps={dragHandleProps}
                  />
                )}
              </SortableFieldList>

              <Button
                variant="light"
                leftSection={<Plus size={15} />}
                onClick={() => setFields((current) => [...current, emptyField()])}
              >
                Add field
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="preview">
            <Text size="sm" c="dimmed" mb="md">
              {previewSchemaFieldsCount === 0
                ? 'Add fields to see a live preview.'
                : 'Live preview — sections render as dividers, tabs as tabbed sections, columns side-by-side, and every control matches the final form.'}
            </Text>
            {previewSchemaFieldsCount > 0 && (
              <DynamicFormFields
                schema={schema}
                value={previewData}
                onChange={setPreviewData}
              />
            )}
          </Tabs.Panel>

          <Tabs.Panel value="json">
            <Stack gap="sm">
              <Group justify="space-between" wrap="wrap">
                <Text size="sm" c="dimmed">
                  Edit the raw schemaJson. Apply to load it into the visual editor.
                </Text>
                {jsonDirty && (
                  <Text size="xs" c="orange" fw={600}>
                    Unsaved JSON edits — apply or discard
                  </Text>
                )}
              </Group>
              <Textarea
                value={jsonDraft}
                onChange={(event) => {
                  setJsonDraft(event.currentTarget.value);
                  setJsonDirty(true);
                }}
                autosize
                minRows={16}
                maxRows={32}
                styles={{
                  input: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 },
                }}
              />
              <Group justify="flex-end">
                <Button
                  variant="light"
                  disabled={!jsonDirty}
                  onClick={() => {
                    setJsonDirty(false);
                    setJsonDraft(JSON.stringify(builderToSchema(fields), null, 2));
                  }}
                >
                  Discard
                </Button>
                <Button
                  variant="light"
                  disabled={!jsonDirty}
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonDraft) as unknown;
                      if (
                        !parsed ||
                        typeof parsed !== 'object' ||
                        !Array.isArray((parsed as { fields?: unknown }).fields)
                      ) {
                        throw new Error('JSON must contain a "fields" array');
                      }
                      setFields(schemaToBuilder(parsed as FormSchema));
                      setJsonDirty(false);
                      notifications.show({ message: 'Schema applied to the visual editor', color: 'teal' });
                    } catch (error) {
                      notifications.show({
                        color: 'red',
                        message: error instanceof Error ? error.message : 'Invalid JSON',
                      });
                    }
                  }}
                >
                  Apply JSON
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {isEdit ? 'Save Changes' : 'Create Form'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
