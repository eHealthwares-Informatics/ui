import {
  Box,
  Button,
  Checkbox,
  ColorInput,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { TagSummary } from '../../lib/tag-types';

/**
 * Pick/manage the tags attached to one patient: checkbox list of existing
 * tags plus an inline creator, saved as a full-set replace.
 */
export function PatientTagsModal({
  opened,
  onClose,
  patientId,
  patientName,
}: {
  opened: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[] | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#228be6');
  const [error, setError] = useState<string | null>(null);

  const tagsQuery = useQuery({
    queryKey: ['emr', 'tags', 'all'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: TagSummary[] }>('/tags', {
        params: { limit: 200, sortBy: 'name', sortOrder: 'asc' },
      });
      return res.data.data;
    },
    enabled: opened,
  });

  const patientTagsQuery = useQuery({
    queryKey: ['emr', 'patients', patientId, 'tags'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: TagSummary[] }>(`/patients/${patientId}/tags`);
      return res.data.data;
    },
    enabled: opened && Boolean(patientId),
  });

  const tags = tagsQuery.data ?? [];
  const currentIds = () => selected ?? (patientTagsQuery.data ?? []).map((t) => t.id);
  const dirty = selected !== null;

  const save = useMutation({
    mutationFn: async (tagIds: string[]) => {
      const { data } = await emrApi.put(`/patients/${patientId}/tags`, { tagIds });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['emr', 'patients'] });
      void queryClient.invalidateQueries({ queryKey: ['emr', 'patients', patientId] });
      onClose();
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const createTag = useMutation({
    mutationFn: async () => {
      const { data } = await emrApi.post('/tags', { name: newName, color: newColor });
      return data as TagSummary;
    },
    onSuccess: (tag) => {
      void queryClient.invalidateQueries({ queryKey: ['emr', 'tags'] });
      setSelected((prev) => [...(prev ?? currentIds()), tag.id]);
      setNewName('');
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const toggle = (id: string) => {
    const current = currentIds();
    setSelected(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Tags — ${patientName ?? patientId}`}
      size="sm"
      centered
    >
      <Stack gap="sm">
        {!opened ? null : tagsQuery.isLoading || patientTagsQuery.isLoading ? (
          <Loader size="sm" type="dots" />
        ) : (
          <Stack gap="xs" mih={120}>
            {tags.length === 0 ? (
              <Text size="sm" c="dimmed">
                No tags yet — create the first one below.
              </Text>
            ) : (
              tags.map((tag) => (
                <Checkbox
                  key={tag.id}
                  label={tag.name}
                  checked={currentIds().includes(tag.id)}
                  onChange={() => toggle(tag.id)}
                />
              ))
            )}
          </Stack>
        )}

        <Box
          component="form"
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            if (newName.trim()) {
              createTag.mutate();
            }
          }}
        >
          <Group gap="xs" align="flex-end" wrap="nowrap">
            <TextInput
              label="New tag"
              placeholder="Tag name"
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <ColorInput
              label="Color"
              format="hex"
              value={newColor}
              onChange={setNewColor}
              swatches={[
                '#228be6',
                '#40c057',
                '#fd7e14',
                '#e64980',
                '#be4bdb',
                '#f59f00',
                '#15aabf',
                '#868e96',
              ]}
              w={130}
            />
            <Button
              type="submit"
              variant="light"
              loading={createTag.isPending}
              disabled={!newName.trim()}
            >
              Add
            </Button>
          </Group>
        </Box>

        {error ? (
          <Text c="red" size="sm">
            {error}
          </Text>
        ) : null}

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={save.isPending}
            disabled={!dirty}
            onClick={() => save.mutate(currentIds())}
          >
            Save tags
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
