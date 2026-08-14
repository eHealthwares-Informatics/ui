import { useState, useEffect } from 'react';
import { Card, Stack, Text, Select, Group, Textarea, Badge, Paper } from '@mantine/core';
import { lisApi } from '@/lib/lis-api';
import { useOrderContext } from '../OrderContext';

interface Location {
  id: string;
  name: string;
  reference: string | null;
  type?: { name: string };
  children?: Location[];
}

export function StorageSection() {
  const { state, dispatch } = useOrderContext();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [sampleStorage, setSampleStorage] = useState<Record<number, { locationId: string | null; notes: string | null }>>({});

  useEffect(() => {
    lisApi.get('/lis/locations', { params: { limit: 200 } }).then((res) => {
      const all: Location[] = res.data?.data ?? [];
      setLocations(all.filter((l) => l.type?.name === 'Storage' || !l.type));
    });
  }, []);

  const updateSampleStorage = (index: number, field: 'locationId' | 'notes', value: string | null) => {
    setSampleStorage((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: value },
    }));
  };

  const locationOptions = locations.map((l) => ({
    value: l.id,
    label: `${l.name}${l.reference ? ` (${l.reference})` : ''}`,
  }));

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Text fw={600}>Storage Assignment</Text>
        <Text size="sm" c="dimmed">
          Assign each sample to a storage location.
        </Text>

        {state.samples.length === 0 && (
          <Text size="sm" c="dimmed">
            No samples to assign storage for. Complete sample collection first.
          </Text>
        )}

        {selectedSample === null && state.samples.length > 0 && (
          <Select
            placeholder="Select a sample to assign storage..."
            data={state.samples.map((s, i) => ({
              value: String(i),
              label: `Sample #${i + 1} - ${s.barcode}`,
            }))}
            onChange={setSelectedSample}
          />
        )}

        {selectedSample !== null && (
          <Paper withBorder p="sm">
            <Group justify="space-between" mb="xs">
              <Badge color="violet" variant="light">
                Sample #{Number(selectedSample) + 1}
              </Badge>
            </Group>
            <Stack gap="xs">
              <Select
                label="Storage Location"
                placeholder="Select location..."
                data={locationOptions}
                value={sampleStorage[Number(selectedSample)]?.locationId ?? null}
                onChange={(v) => updateSampleStorage(Number(selectedSample), 'locationId', v)}
                searchable
                clearable
              />
              <Textarea
                label="Storage Notes"
                placeholder="Condition notes, position, etc."
                value={sampleStorage[Number(selectedSample)]?.notes ?? ''}
                onChange={(e) => updateSampleStorage(Number(selectedSample), 'notes', e.currentTarget.value || null)}
                minRows={2}
              />
            </Stack>
          </Paper>
        )}

        {Object.keys(sampleStorage).length > 0 && (
          <Paper withBorder p="sm" bg="green.0">
            <Text size="sm" fw={500}>
              Storage assigned for {Object.keys(sampleStorage).length} of {state.samples.length} samples
            </Text>
          </Paper>
        )}
      </Stack>
    </Card>
  );
}
