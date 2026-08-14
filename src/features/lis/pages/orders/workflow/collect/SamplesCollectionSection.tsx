import {
  Card,
  Stack,
  Text,
  TextInput,
  Group,
  Button,
  Select,
  Badge,
  Paper,
  NumberInput,
} from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { lisApi } from '@/lib/lis-api';
import { useOrderContext } from '../OrderContext';

interface SampleType {
  id: string;
  key: string;
  name: string;
  defaultQuantity?: number | null;
  minimumQuantity?: number | null;
  unit?: string | null;
  containerType?: string | null;
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
    lisApi
      .get('/lis/test-definitions', { params: { limit: 200, fields: 'id,methodId' } })
      .then((res) => {
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
    const firstType = sampleTypes[0];
    dispatch({
      type: 'SET_SAMPLES',
      payload: [
        ...state.samples,
        {
          barcode: `S-${Date.now()}`,
          sampleTypeId: firstType?.id ?? '',
          collector: '',
          collectionDate: null,
          collectionMethod: getDefaultCollectionMethod(),
          collectionConditions: null,
          quantity: firstType?.defaultQuantity ?? null,
          notes: null,
        },
      ],
    });
  };

  const updateSample = (index: number, field: string, value: unknown) => {
    const samples = [...state.samples];
    samples[index] = { ...samples[index], [field]: value };
    if (field === 'sampleTypeId') {
      const st = sampleTypes.find((t) => t.id === value);
      samples[index].quantity = st?.defaultQuantity ?? null;
    }
    dispatch({ type: 'SET_SAMPLES', payload: samples });
  };

  const sampleTypeFor = (sample: (typeof state.samples)[number]) =>
    sampleTypes.find((st) => st.id === sample.sampleTypeId);

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

        {state.samples.map((sample, i) => {
          const selectedType = sampleTypeFor(sample);
          return (
            <Paper key={i} withBorder p="sm" radius="md">
              <Group justify="space-between" mb="xs">
                <Badge color="violet" variant="light">
                  Sample #{i + 1}
                </Badge>
                <Button
                  size="xs"
                  color="red"
                  variant="subtle"
                  leftSection={<Trash2 size={14} />}
                  onClick={() => removeSample(i)}
                >
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
                  data={sampleTypes.map((st) => ({ value: st.id, label: st.name }))}
                  value={sample.sampleTypeId}
                  onChange={(v) => updateSample(i, 'sampleTypeId', v)}
                  searchable
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
                <div>
                  <NumberInput
                    label="Quantity"
                    placeholder="Volume collected"
                    value={sample.quantity ?? ''}
                    onChange={(v) => updateSample(i, 'quantity', v === '' ? null : v)}
                    min={0}
                  />
                  {selectedType && (
                    <Text size="xs" c="dimmed" mt={4}>
                      {selectedType.minimumQuantity != null &&
                        `Min: ${selectedType.minimumQuantity}${selectedType.unit ?? ''} · `}
                      {selectedType.defaultQuantity != null &&
                        `Preferred: ${selectedType.defaultQuantity}${selectedType.unit ?? ''}`}
                    </Text>
                  )}
                </div>
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
              {selectedType?.containerType && (
                <Text size="xs" c="dimmed" mt="xs">
                  Required container: {selectedType.containerType}
                </Text>
              )}
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
          );
        })}
      </Stack>
    </Card>
  );
}
