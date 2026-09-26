import { Alert, Button, Grid, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { AlertCircle, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  mergeRowToSaved,
  PricingMatrixRow,
} from '@/features/rxsoft/pages/products/utils/pricing-matrix-helper';
import { DataTable } from '../table/table';
import { Props } from './FieldGroup';
import { RenderField } from './RenderField';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

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


  const syncRows = useCallback(
    (nextRows: Record<string, unknown>[], nextOriginalRows?: Record<string, unknown>[]) => {
      setRows(nextRows);
      if (nextOriginalRows) {
        setOriginalRows(nextOriginalRows);
      }
      updateField(rowsField, nextRows, index);
    },
    [index, rowsField, updateField]
  );

  const updateLocalFormState = (name: string, value: string, _: any) => {
    setLocalFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const loadMatrix = useCallback(async () => {
    if (!parentId) {
      syncRows([], []);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const matrixRows = await fieldGroup.matrix.load({ [fieldGroup.parentId || '']: parentId });
      syncRows(matrixRows, matrixRows);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pricing matrix';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [parentId, syncRows]);

  const matrixColumns = useMemo(() => {
    return (fieldGroup.columns || []).map((column) => {
      if (!column.editable || !column.field) {
        return column;
      }

      return {
        ...column,
        editable: true,
        field: {
          ...column.field,
          updateField: (row: PricingMatrixRow, name: string, value: unknown) => {
            updateMatrixRow(
              row.id,
              name as keyof PricingMatrixRow, //rows as any,
              value
            );
          },
        },
      };
    });
  }, [rows, setRows, updateField, index, rowsField, fieldGroup.columns]);

  useEffect(() => {
    setLocalFormState((current) => ({ ...current, [fieldGroup.parentId || '']: parentId }));
    const existingRows = formState[rowsField] as Record<string, unknown>[] | undefined;
    if (existingRows && existingRows.length > 0) {
      setRows(existingRows);
      setOriginalRows(existingRows);
    } else if (parentId) {
      loadMatrix();
    } else {
      syncRows([], []);
    }
  }, [parentId]);

  const updateMatrixRow = (rowId: string, field: keyof PricingMatrixRow, value: unknown) => {
    const nextRows = rows.map((row) =>
      row.id === rowId
        ? {
            ...row,
            [field]: field === 'unitPrice' && value !== '' ? Number(value) : value,
            dirty: true,
            error: undefined,
          }
        : row
    );
    setRows(nextRows);
    updateField(rowsField, nextRows, index);
  };

  const resetRow = (rowId: string) => {
    const original = originalRows.find((row) => row.id === rowId);
    if (!original) {
      return;
    }

    const nextRows = rows.map((row) => (row.id === rowId ? original : row));
    setRows(nextRows);
    updateField(rowsField, nextRows, index);
  };

  const saveRow = async (row: PricingMatrixRow) => {
    const validation = fieldGroup.matrix.validate(row);
    if (!validation.valid) {
      const nextRows = rows.map((item) =>
        item.id === row.id ? { ...item, error: validation.error } : item
      );
      setRows(nextRows);
      updateField(rowsField, nextRows, index);
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

      const nextRows = rows.map((item) => (item.id === row.id ? savedRow : item));
      const nextOriginalRows = originalRows.map((item) => (item.id === row.id ? savedRow : item));
      syncRows(nextRows, nextOriginalRows);
      notifications.show({
        title: `${fieldGroup.title  } saved`,
        message: `${row.priceListName}  updated`,
        color: 'green',
      });
    } catch (err: any) {
      const message = getApiErrorMessage(err);
      const nextRows = rows.map((item) =>
        item.id === row.id ? { ...item, error: String(message) } : item
      );
      setRows(nextRows);
      updateField(rowsField, nextRows, index);
      notifications.show({
        title: `${fieldGroup.title  } save failed`,
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
        title: `${title  } saved`,
        message: 'Manual price entry created',
        color: 'green',
      });
    } catch (err: any) {
      const message = getApiErrorMessage(err);
      setError(String(message));
      notifications.show({ title: `${title  } save failed`, message: String(message), color: 'red' });
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
