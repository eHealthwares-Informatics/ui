import {
  Card,
  Stack,
  Text,
  Select,
  Group,
  Textarea,
  Badge,
  Paper,
  Autocomplete,
  Button,
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { lisApi } from '@/lib/lis-api';
import { useOrderContext } from '../OrderContext';

interface Location {
  id: string;
  name: string;
  reference: string | null;
  type?: { name: string };
  children?: Location[];
  storageAssignment?: boolean;
}

export function StorageSection() {
  const { state, dispatch } = useOrderContext();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  useEffect(() => {
    lisApi.get('/lis/locations', { params: { limit: 200 } }).then((res) => {
      const all: Location[] = res.data?.data ?? [];
      setLocations(all.filter((l) => l.storageAssignment));
    });
  }, []);

  const updateSampleStorage = (
    index: number,
    field: 'storageLocationId' | 'storageNotes',
    value: string | null
  ) => {
    const samples = [...state.samples];
    samples[index] = { ...samples[index], [field]: value };
    dispatch({ type: 'SET_SAMPLES', payload: samples });
  };

  const locationOptions = locations.map((l) => ({
    value: l.id,
    label: `${l.name}${l.reference ? ` (${l.reference})` : ''}`,
  }));

  const locationLabel = (id: string | null) =>
    locationOptions.find((o) => o.value === id)?.label ?? '';

  const storageFor = (index: number) => ({
    storageLocationId: state.samples[index]?.storageLocationId ?? null,
    storageNotes: state.samples[index]?.storageNotes ?? null,
  });

  const assignedCount = state.samples.filter((s) => s.storageLocationId).length;

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
              label: `Sample #${i + 1} - ${s.barcode}${s.storageLocationId ? ' ✓' : ''}`,
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
              <Button size="xs" variant="subtle" color="gray" onClick={() => setSelectedSample(null)}>
                Back
              </Button>
            </Group>
            <Stack gap="xs">
              <Autocomplete
                label="Storage Location"
                placeholder="Type to search location..."
                data={locationOptions.map((o) => o.label)}
                value={locationLabel(storageFor(Number(selectedSample)).storageLocationId)}
                onChange={(value) => {
                  const loc = locationOptions.find((o) => o.label === value);
                  updateSampleStorage(Number(selectedSample), 'storageLocationId', loc?.value ?? null);
                }}
                limit={20}
              />
              <Textarea
                label="Storage Notes"
                placeholder="Condition notes, position, etc."
                value={storageFor(Number(selectedSample)).storageNotes ?? ''}
                onChange={(e) =>
                  updateSampleStorage(
                    Number(selectedSample),
                    'storageNotes',
                    e.currentTarget.value || null
                  )
                }
                minRows={2}
              />
            </Stack>
          </Paper>
        )}

        {state.samples.length > 0 && (
          <Paper withBorder p="sm" bg={assignedCount > 0 ? 'green.0' : 'gray.0'}>
            <Text size="sm" fw={500}>
              Storage assigned for {assignedCount} of {state.samples.length} samples
            </Text>
          </Paper>
        )}
      </Stack>
    </Card>
  );
}
