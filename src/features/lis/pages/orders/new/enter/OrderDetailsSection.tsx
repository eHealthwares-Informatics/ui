import { Card, Stack, Text, TextInput, Select, Textarea, Group } from '@mantine/core';
import { useEffect, useState } from 'react';
import { lisApi } from '@/lib/lis-api';
import { useOrderContext } from '../OrderContext';

interface Priority {
  id: string;
  name: string;
}

export function OrderDetailsSection() {
  const { state, dispatch } = useOrderContext();
  const [priorities, setPriorities] = useState<Priority[]>([]);

  useEffect(() => {
    lisApi.get('/lis/priorities', { params: { limit: 50 } }).then((res) => {
      setPriorities(res.data?.data ?? []);
    });
  }, []);

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Text fw={600}>Order Details</Text>

        <Group grow>
          <Select
            label="Priority"
            placeholder="Select priority"
            data={priorities.map((p) => ({ value: p.id, label: p.name }))}
            value={state.priorityId}
            onChange={(v) => dispatch({ type: 'UPDATE_FIELD', payload: { name: 'priorityId', value: v } })}
            clearable
          />
          <TextInput
            label="Requested Date"
            type="date"
            value={state.requestedDate ?? ''}
            onChange={(e) => dispatch({ type: 'UPDATE_FIELD', payload: { name: 'requestedDate', value: e.currentTarget.value || null } })}
          />
        </Group>

        <Text fw={600} mt="sm">
          Requester
        </Text>
        <Group grow>
          <TextInput
            label="Requester Name"
            placeholder="Referring physician or provider"
            value={state.requesterName ?? ''}
            onChange={(e) => dispatch({ type: 'UPDATE_FIELD', payload: { name: 'requesterName', value: e.currentTarget.value || null } })}
          />
          <TextInput
            label="Requester Phone"
            placeholder="Contact number"
            value={state.requesterPhone ?? ''}
            onChange={(e) => dispatch({ type: 'UPDATE_FIELD', payload: { name: 'requesterPhone', value: e.currentTarget.value || null } })}
          />
        </Group>

        <Text fw={600} mt="sm">
          Clinical Info
        </Text>
        <TextInput
          label="Diagnosis"
          placeholder="Provisional diagnosis"
          value={state.diagnosis ?? ''}
          onChange={(e) => dispatch({ type: 'UPDATE_FIELD', payload: { name: 'diagnosis', value: e.currentTarget.value || null } })}
        />
        <Textarea
          label="Clinical Notes"
          placeholder="Additional clinical notes"
          value={state.clinicalNotes ?? ''}
          onChange={(e) => dispatch({ type: 'UPDATE_FIELD', payload: { name: 'clinicalNotes', value: e.currentTarget.value || null } })}
          minRows={2}
        />

        <Textarea
          label="Order Notes"
          placeholder="Internal notes"
          value={state.notes ?? ''}
          onChange={(e) => dispatch({ type: 'UPDATE_FIELD', payload: { name: 'notes', value: e.currentTarget.value || null } })}
          minRows={2}
        />
      </Stack>
    </Card>
  );
}
