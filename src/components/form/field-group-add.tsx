import { Alert, Button, Grid, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { AlertCircle, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  mergeRowToSaved,
  PricingMatrixRow,
} from '@/features/rxsoft/pages/products/utils/pricing-matrix-helper';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { DataTable } from '../table/table';
import { Props } from './FieldGroup';
import { RenderField } from './RenderField';

export function FieldGroupAdd({ title, fieldGroup, formState, updateField, index }: Props) {
  const parentId = String(formState.id) || '';
  const rowsField = fieldGroup.rowsField ?? fieldGroup.formStateField ?? 'matrixRows';
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [originalRows, setOriginalRows] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localFormState, setLocalFormState] = useState<Record<string, unknown>>({
    ...fieldGroup.defaultState,
    [fieldGroup.parentId || '']: parentId,
  });

  const updateFieldRef = useRef(updateField);
  const rowsRef = useRef(rows);
  const originalRowsRef = useRef(originalRows);

  useEffect(() => {
    updateFieldRef.current = updateField;
    rowsRef.current = rows;
    originalRowsRef.current = originalRows;
  });

  const commitRows = useCallback(
    (nextRows: Record<string, unknown>[], nextOriginalRows?: Record<string, unknown>[]) => {
      setRows(nextRows);
      if (nextOriginalRows) {
        setOriginalRows(nextOriginalRows);
      }
      updateFieldRef.current(rowsField, nextRows, index);
    },
    [index, rowsField]
  );

  const updateLocalFormState = (name: string, value: string, _: any) => {
    setLocalFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const loadMatrix = useCallback(async () => {
    if (!parentId) {
      commitRows([], []);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const matrixRows = await fieldGroup.matrix.load({ [fieldGroup.parentId || '']: parentId });
      commitRows(matrixRows, matrixRows);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pricing matrix';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [parentId, commitRows]);

  useEffect(() => {
    setLocalFormState((current) => ({ ...current, [fieldGroup.parentId || '']: parentId }));
    const existingRows = formState[rowsField] as Record<string, unknown>[] | undefined;
    if (existingRows && existingRows.length > 0) {
      setRows(existingRows);
      setOriginalRows(existingRows);
    } else if (parentId) {
      loadMatrix();
    } else {
      commitRows([], []);
    }
  }, [parentId]);

  const updateMatrixRow = useCallback(
    (rowId: string, field: keyof PricingMatrixRow, value: unknown) => {
      commitRows(
        rowsRef.current.map((row) =>
          row.id === rowId
            ? {
                ...row,
                [field]: field === 'unitPrice' && value !== '' ? Number(value) : value,
                dirty: true,
                error: undefined,
              }
            : row
        )
      );
    },
    [commitRows]
  );

  const matrixColumns = useMemo(() => {
    return (fieldGroup.columns || []).map((column) => {
      if (!column.editable || !column.field) {
        return column;
      }

      return {
        ...column,
        editable: true,
        error: (row: Record<string, unknown>) => row.error as string | undefined,
        field: {
          ...column.field,
          updateField: (row: PricingMatrixRow, name: string, value: unknown) => {
            updateMatrixRow(row.id, name as keyof PricingMatrixRow, value);
          },
        },
      };
    });
  }, [fieldGroup.columns, updateMatrixRow]);

  const resetRow = (rowId: string) => {
    const original = originalRowsRef.current.find((row) => row.id === rowId);
    if (!original) {
      return;
    }

    commitRows(rowsRef.current.map((row) => (row.id === rowId ? original : row)));
  };

  const saveRow = async (row: PricingMatrixRow) => {
    const validation = fieldGroup.matrix.validate(row);
    if (!validation.valid) {
      const message = validation.error ?? 'Invalid row';
      const nextRows = rowsRef.current.map((item) =>
        item.id === row.id ? { ...item, error: message } : item
      );
      commitRows(nextRows);
      notifications.show({
        title: `${fieldGroup.title} save failed`,
        message,
        color: 'red',
      });
      return;
    }

    setSavingRowId(row.id);
    try {
      const response = await fieldGroup.matrix.save({
        ...row,
        [fieldGroup.parentId || '']: parentId,
      });
      const saved = response.data;
      const savedRow: Record<string, unknown> = {
        ...mergeRowToSaved(saved, row),
        exists: true,
        dirty: false,
        error: undefined,
      };

      const nextRows = rowsRef.current.map((item) => (item.id === row.id ? savedRow : item));
      const nextOriginalRows = originalRowsRef.current.map((item) =>
        item.id === row.id ? savedRow : item
      );
      commitRows(nextRows, nextOriginalRows);
      notifications.show({
        title: `${fieldGroup.title} saved`,
        message: `${row.priceListName}  updated`,
        color: 'green',
      });
    } catch (err: any) {
      const message = getApiErrorMessage(err);
      const nextRows = rowsRef.current.map((item) =>
        item.id === row.id ? { ...item, error: String(message) } : item
      );
      commitRows(nextRows);
      notifications.show({
        title: `${fieldGroup.title} save failed`,
        message: String(message),
        color: 'red',
      });
    } finally {
      setSavingRowId(null);
    }
  };

  const createManualEntry = async () => {
    // const priceList = localFormState.priceList as Option | undefined
    // const unitPrice = manualEntry.unitPrice
    // if (!priceList?.value || unitPrice === '' || unitPrice === null || unitPrice === undefined) {
    //     setError('Select a price list and enter a unit price.')
    //     return
    // }

    setSavingRowId('manual-entry');
    setError(null);
    try {
      // await apiProvider.post('/price-lists/items', {
      //     priceListId: priceList.value,
      //     productId,
      //     currencyCode: manualEntry.currencyCode || 'NGN',
      //     unitPrice: Number(unitPrice),
      // })
      const payload = fieldGroup.buildPayload
        ? fieldGroup.buildPayload(localFormState)
        : localFormState;
      fieldGroup.matrix.manualEntry.create(payload);
      setLocalFormState({
        ...fieldGroup.defaultState,
        [fieldGroup.parentId || '']: parentId,
      });
      await loadMatrix();
      notifications.show({
        title: `${title} saved`,
        message: 'Manual price entry created',
        color: 'green',
      });
    } catch (err: any) {
      const message = getApiErrorMessage(err);
      setError(String(message));
      notifications.show({ title: `${title} save failed`, message: String(message), color: 'red' });
    } finally {
      setSavingRowId(null);
    }
  };

  return (
    <Stack key={`${title ?? 'group'}-${index}`} gap="md">
      {title && (
        <Group justify="space-between">
          <Text size="sm" fw={500}>
            {title}
          </Text>
          <Button variant="subtle" size="xs" onClick={loadMatrix} disabled={isLoading || !parentId}>
            Refresh
          </Button>
        </Group>
      )}

      {error && (
        <Alert icon={<AlertCircle size={16} />} color="red">
          {error}
        </Alert>
      )}

      <DataTable
        columns={(matrixColumns as any) || []}
        rows={rows as any}
        isLoading={isLoading}
        errorLoading={false}
        actionCellProps={{
          saveRow,
          savingRowIndex: savingRowId,
          resetRow,
        }}
      />

      {/* <Stack gap="sm">
        <Text size="sm" fw={500}>
          Manual Entry
        </Text>

        <Grid gap="md">
          {fieldGroup.fields
            .filter((field) => field.type !== 'hidden')
            .map((field) => {
              return (
                <Grid.Col span={{ base: 12, md: field.col ?? 12 }}>
                  <RenderField
                    field={field}
                    value={'' as any}
                    updateField={(_, value) => updateLocalFormState(field.name, value, _)}
                    useFormContext={false}
                  />
                </Grid.Col>
              );
            })}
        </Grid>
        <Group justify="flex-end">
          <Button
            size="xs"
            leftSection={<Plus size={14} />}
            loading={savingRowId === 'manual-entry'}
            disabled={!parentId || savingRowId !== null}
            onClick={createManualEntry}
          >
            Add Price
          </Button>
        </Group>
      </Stack> */}
    </Stack>
  );
}
