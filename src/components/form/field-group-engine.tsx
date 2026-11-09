/**
 * FieldGroupEngine Component
 *
 * Spec-driven form renderer that executes FieldGroupSpec declaratively.
 *
 * This component is the core of the refactored form system:
 * - Consumes FieldGroupSpec (declarative configuration)
 * - Uses FormProvider for state management
 * - Executes effects (fetch, sync, compute)
 * - Handles mutations based on mutationMode
 * - Renders fields via RenderField
 * - Provides proper UI controls (Add, Save, etc.)
 */

import { Stack, Text, Group, Button, ActionIcon, LoadingOverlay, Alert } from '@mantine/core';
import { AlertCircle, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { executeEffectsWithHandler, buildEffectDependencies } from './effects';
import { useFormContext } from './form-context';
import { runMutation } from './mutation';
import { RenderField } from './RenderField';
import { FieldGroupSpec, FormEvent } from './types/form-context';

interface FieldGroupEngineProps {
  spec: FieldGroupSpec;
  index?: number;
  onError?: (error: Error) => void;
  onSuccess?: (action: string) => void;
}

export function FieldGroupEngine({ spec, index = 0, onError, onSuccess }: FieldGroupEngineProps) {
  const form = useFormContext();
  const [localRows, setLocalRows] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Run initial effects (fetch, compute) on mount
  useEffect(() => {
    setIsLoading(true);
    executeEffectsWithHandler(
      spec.effects,
      { form, localRows, setLocalRows, apiProvider: {} },
      (err) => {
        setError(err.message);
        onError?.(err);
        setIsLoading(false);
      }
    ).then(() => {
      setIsLoading(false);
    });
  }, [spec, form, onError]);

  // Watch dependencies for effects (refetch if watched fields change)
  const effectDeps = buildEffectDependencies(spec.effects);
  useEffect(
    () => {
      const watchedValues = effectDeps.map((dep) => form.getField(dep as any));

      setIsLoading(true);
      executeEffectsWithHandler(
        spec.effects,
        { form, localRows, setLocalRows, apiProvider: {} },
        (err) => {
          setError(err.message);
          onError?.(err);
        }
      ).then(() => {
        setIsLoading(false);
      });
    },
    effectDeps.map((dep) => form.getField(dep as any))
  );

  /**
   * Handle form event (field change, action, etc.)
   */
  const handleEvent = useCallback(
    (event: FormEvent) => {
      try {
        setError(undefined);

        // Execute mutation based on mutation mode
        runMutation(event, spec, {
          form,
          localRows,
          setLocalRows,
          event,
          spec,
        });

        // Notify on action completion
        if (event.action) {
          onSuccess?.(event.action);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error.message);
        onError?.(error);
      }
    },
    [spec, form, localRows, onError, onSuccess]
  );

  /**
   * Show UI based on mutation mode
   */
  const shouldShowAddButton = spec.mutationMode !== 'cell';
  const shouldShowSaveButton = spec.mutationMode === 'collection';
  const shouldShowDeleteButtons = spec.mutationMode === 'collection';
  const shouldShowLocalRows = spec.mutationMode === 'collection' || spec.mutationMode === 'cell';

  return (
    <Stack gap="md" pos="relative">
      {/* Loading overlay */}
      <LoadingOverlay visible={isLoading} zIndex={1000} />

      {/* Error display */}
      {error && (
        <Alert icon={<AlertCircle size={16} />} color="red">
          {error}
        </Alert>
      )}

      {/* Title */}
      {spec.title && (
        <Text fw={700} size="lg">
          {spec.title}
        </Text>
      )}

      {/* Field inputs */}
      <Stack gap="sm">
        {spec.fields.map((field) => (
          <RenderField
            key={field.name}
            field={field}
            disabled={isLoading}
            value={form.getField(field.name)}
            onChange={(value) =>
              handleEvent({
                type: 'field-change',
                field: field.name,
                value,
              })
            }
            onBlur={() =>
              handleEvent({
                type: 'field-blur',
                field: field.name,
              })
            }
            onFocus={() =>
              handleEvent({
                type: 'field-focus',
                field: field.name,
              })
            }
          />
        ))}
      </Stack>

      {/* Add Row button (for row/collection mode) */}
      {shouldShowAddButton && spec.mutationMode !== 'field' && (
        <Group justify="flex-start">
          <Button
            leftSection={<Plus size={16} />}
            onClick={() =>
              handleEvent({
                type: 'action',
                action: spec.mutationMode === 'collection' ? 'add-row' : 'add-row',
              })
            }
            disabled={isLoading}
          >
            {spec.mutationMode === 'row' ? 'Add Row' : 'Add Item'}
          </Button>
        </Group>
      )}

      {/* Local Rows Display (for collection/cell mode) */}
      {shouldShowLocalRows && localRows.length > 0 && (
        <LocalRowsDisplay
          rows={localRows}
          fields={spec.fields}
          showDeleteButtons={shouldShowDeleteButtons}
          onUpdateRow={(rowIndex, field, value) =>
            handleEvent({
              type: 'action',
              action: 'update-row',
              payload: { rowIndex, field, value },
            })
          }
          onDeleteRow={(rowIndex) =>
            handleEvent({
              type: 'action',
              action: 'delete-row',
              payload: { rowIndex },
            })
          }
        />
      )}

      {/* Save All button (for collection mode) */}
      {shouldShowSaveButton && (
        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={() =>
              handleEvent({
                type: 'action',
                action: 'reset-rows',
              })
            }
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            leftSection={<Save size={16} />}
            onClick={() =>
              handleEvent({
                type: 'action',
                action: 'save-all',
              })
            }
            disabled={isLoading || localRows.length === 0}
          >
            Save All
          </Button>
        </Group>
      )}
    </Stack>
  );
}

/**
 * Display local rows in a table-like format
 */
function LocalRowsDisplay({
  rows,
  fields,
  showDeleteButtons,
  onUpdateRow,
  onDeleteRow,
}: {
  rows: Record<string, any>[];
  fields: any[];
  showDeleteButtons: boolean;
  onUpdateRow: (rowIndex: number, field: string, value: any) => void;
  onDeleteRow: (rowIndex: number) => void;
}) {
  return (
    <Stack gap="sm">
      <Text fw={500} size="sm" c="dimmed">
        {rows.length} item{rows.length !== 1 ? 's' : ''}
      </Text>

      {rows.map((row, rowIndex) => (
        <Group
          key={rowIndex}
          gap="xs"
          p="xs"
          style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
        >
          {/* Row content */}
          {fields.map((field) => (
            <div key={field.name} style={{ flex: 1 }}>
              <input
                type="text"
                value={row[field.name] ?? ''}
                onChange={(e) => onUpdateRow(rowIndex, field.name, e.target.value)}
                placeholder={field.label}
                style={{
                  padding: '4px 8px',
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid var(--mantine-color-gray-3)',
                  width: '100%',
                }}
              />
            </div>
          ))}

          {/* Delete button */}
          {showDeleteButtons && (
            <ActionIcon color="red" variant="light" onClick={() => onDeleteRow(rowIndex)}>
              <Trash2 size={16} />
            </ActionIcon>
          )}
        </Group>
      ))}
    </Stack>
  );
}
