import { useState, useEffect } from 'react';
import { Card, Stack, Text, TextInput, Group, Button, Select, Badge, Paper, NumberInput } from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';
import { lisApi } from '@/lib/lis-api';
import { useOrderContext } from '../OrderContext';

interface SampleType {
  id: string;
  name: string;
  key: string;
}

interface Method {
  id: string;
  name: string;
}

interface TestDefinition {
  id: string;
  methodId?: string;
}

export function SamplesCollectionSection() {
  const { state, dispatch } = useOrderContext();
  const [sampleTypes, setSampleTypes] = useState<SampleType[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [testDefs, setTestDefs] = useState<TestDefinition[]>([]);

  useEffect(() => {
    lisApi.get('/lis/sample-types', { params: { limit: 100 } }).then((res) => {
      setSampleTypes(res.data?.data ?? []);
    });
    lisApi.get('/lis/methods', { params: { limit: 100 } }).then((res) => {
      setMethods(res.data?.data ?? []);
    });
    lisApi.get('/lis/test-definitions', { params: { limit: 200, fields: 'id,methodId' } }).then((res) => {
      setTestDefs(res.data?.data ?? []);
    });
  }, []);

  const getDefaultCollectionMethod = (): string | null => {
    const firstItem = state.items[0];
    if (!firstItem) return null;
    const td = testDefs.find((t) => t.id === firstItem.testDefinitionId);
    if (!td?.methodId) return null;
    const m = methods.find((m) => m.id === td.methodId);
    return m?.name ?? null;
  };

  const addSample = () => {
    dispatch({
      type: 'SET_SAMPLES',
      payload: [
        ...state.samples,
        {
          barcode: `S-${Date.now()}`,
          sampleType: sampleTypes[0]?.key ?? '',
          collector: '',
          collectionDate: null,
          collectionMethod: getDefaultCollectionMethod(),
          collectionConditions: null,
          quantity: null,
          notes: null,
        },
      ],
    });
  };

  const updateSample = (index: number, field: string, value: unknown) => {
    const samples = [...state.samples];
    samples[index] = { ...samples[index], [field]: value };
    dispatch({ type: 'SET_SAMPLES', payload: samples });
  };

  const removeSample = (index: number) => {
    dispatch({ type: 'SET_SAMPLES', payload: state.samples.filter((_, i) => i !== index) });
  };

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Samples</Text>
          <Button size="xs" leftSection={<Plus size={14} />} onClick={addSample}>
            Add Sample
          </Button>
        </Group>

        {state.samples.length === 0 && (
          <Text size="sm" c="dimmed">
            No samples added yet. Click "Add Sample" to begin.
          </Text>
        )}

        {state.samples.map((sample, i) => (
          <Paper key={i} withBorder p="sm" radius="md">
            <Group justify="space-between" mb="xs">
              <Badge color="violet" variant="light">
                Sample #{i + 1}
              </Badge>
              <Button size="xs" color="red" variant="subtle" leftSection={<Trash2 size={14} />} onClick={() => removeSample(i)}>
                Remove
              </Button>
            </Group>

            <Group grow>
              <TextInput
                label="Barcode"
                value={sample.barcode}
                onChange={(e) => updateSample(i, 'barcode', e.currentTarget.value)}
                required
              />
              <Select
                label="Sample Type"
                placeholder="Select sample type"
                data={sampleTypes.map((st) => ({ value: st.key, label: st.name }))}
                value={sample.sampleType}
                onChange={(v) => updateSample(i, 'sampleType', v)}
              />
            </Group>
            <Group grow mt="xs">
              <TextInput
                label="Collector"
                placeholder="Name of collector"
                value={sample.collector ?? ''}
                onChange={(e) => updateSample(i, 'collector', e.currentTarget.value)}
              />
              <TextInput
                label="Collection Date"
                type="date"
                value={sample.collectionDate ?? ''}
                onChange={(e) => updateSample(i, 'collectionDate', e.currentTarget.value || null)}
              />
            </Group>
            <Group grow mt="xs">
              <NumberInput
                label="Quantity"
                placeholder="Volume collected"
                value={sample.quantity ?? ''}
                onChange={(v) => updateSample(i, 'quantity', v === '' ? null : v)}
                min={0}
              />
              <Select
                label="Collection Method"
                placeholder="Select method"
                data={methods.map((m) => ({ value: m.name, label: m.name }))}
                value={sample.collectionMethod ?? ''}
                onChange={(v) => updateSample(i, 'collectionMethod', v)}
                clearable
                searchable
              />
            </Group>
            <TextInput
              label="Collection Conditions"
              placeholder="e.g. Fasting, Time since meal"
              value={sample.collectionConditions ?? ''}
              onChange={(e) => updateSample(i, 'collectionConditions', e.currentTarget.value)}
              mt="xs"
            />
            <TextInput
              label="Notes"
              placeholder="Sample notes"
              value={sample.notes ?? ''}
              onChange={(e) => updateSample(i, 'notes', e.currentTarget.value)}
              mt="xs"
            />
          </Paper>
        ))}
      </Stack>
    </Card>
  );
}