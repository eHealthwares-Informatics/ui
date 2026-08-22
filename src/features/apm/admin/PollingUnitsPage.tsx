import { useState } from 'react';
import {
  Box, Card, Group, Skeleton, Stack, Text, Title, Badge, Table,
  Button, Modal, TextInput, Select, NumberInput, Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useParams, useRouter } from '@tanstack/react-router';
import { useWardPollingUnits, useUpdatePollingUnit } from '../website/admin-hooks';
import { apmBlue, apmGreen, ink, muted } from '../website/layout';

const riskColors: Record<string, string> = {
  green: '#16A34A', yellow: '#EAB308', red: '#DC2626', grey: '#94A3B8',
};
const conversionColors: Record<string, string> = {
  won: '#16A34A', engaged: '#3B82F6', untouched: '#94A3B8', lost: '#DC2626',
};

export function PollingUnitsPage() {
  const { wardId } = useParams({ from: '/apm/admin/polling-units/$wardId' });
  const { data: pus, isLoading } = useWardPollingUnits(wardId);
  const updatePu = useUpdatePollingUnit();
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedPu, setSelectedPu] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const openEditModal = (pu: any) => {
    setSelectedPu(pu);
    setForm({
      riskLevel: pu.riskLevel,
      conversionStatus: pu.conversionStatus,
      registeredVoters: pu.registeredVoters,
      pastResultApm: pu.pastResultApm,
      pastResultPdp: pu.pastResultPdp,
      pastResultApc: pu.pastResultApc,
      pastResultOther: pu.pastResultOther,
      assignedAgentName: pu.assignedAgentName ?? '',
      assignedAgentPhone: pu.assignedAgentPhone ?? '',
      notes: pu.notes ?? '',
    });
    open();
  };

  const handleSave = () => {
    if (!selectedPu) {return;}
    updatePu.mutate({ id: selectedPu.id ?? selectedPu._id, data: form }, { onSuccess: close });
  };

  return (
    <Stack gap="lg">
      <Group>
        <Button variant="subtle" onClick={() => router.history.back()}>
          ← Back
        </Button>
        <Title order={3} style={{ color: ink }}>Polling Units</Title>
      </Group>

      {isLoading ? (
        <Skeleton height={400} radius="md" />
      ) : (
        <Card padding="lg" radius="md" withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Code</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Registered Voters</Table.Th>
                <Table.Th>APM (Prev)</Table.Th>
                <Table.Th>PDP (Prev)</Table.Th>
                <Table.Th>Risk</Table.Th>
                <Table.Th>Conversion</Table.Th>
                <Table.Th>Agent</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(pus ?? []).map((pu: any) => (
                <Table.Tr key={pu.id ?? pu._id}>
                  <Table.Td fw={600} style={{ fontSize: 13 }}>{pu.code}</Table.Td>
                  <Table.Td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pu.name}
                  </Table.Td>
                  <Table.Td>{pu.registeredVoters.toLocaleString()}</Table.Td>
                  <Table.Td>
                    <Text fw={600} style={{ color: apmGreen }}>{pu.pastResultApm}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} style={{ color: '#3B82F6' }}>{pu.pastResultPdp}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={pu.riskLevel === 'red' ? 'red' : pu.riskLevel === 'yellow' ? 'yellow' : pu.riskLevel === 'green' ? 'green' : 'gray'}>
                      {pu.riskLevel}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={pu.conversionStatus === 'won' ? 'green' : pu.conversionStatus === 'engaged' ? 'blue' : pu.conversionStatus === 'lost' ? 'red' : 'gray'}>
                      {pu.conversionStatus}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ fontSize: 13, color: muted }}>
                    {pu.assignedAgentName ?? '—'}
                  </Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="light" style={{ color: apmBlue }}
                      onClick={() => openEditModal(pu)}>
                      Edit
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {(pus ?? []).length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={9} style={{ textAlign: 'center', color: muted }}>
                    No polling units found for this ward
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal opened={opened} onClose={close} title={`Edit: ${selectedPu?.code ?? ''}`} size="md">
        <Stack gap="sm">
          <Select label="Risk Level" data={['green', 'yellow', 'red', 'grey'].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
            value={form.riskLevel} onChange={(v) => setForm({ ...form, riskLevel: v ?? 'grey' })} />
          <Select label="Conversion Status" data={['untouched', 'engaged', 'won', 'lost'].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
            value={form.conversionStatus} onChange={(v) => setForm({ ...form, conversionStatus: v ?? 'untouched' })} />
          <NumberInput label="Registered Voters" value={form.registeredVoters} min={0}
            onChange={(v) => setForm({ ...form, registeredVoters: (v as number) ?? 0 })} />
          <Group grow>
            <NumberInput label="APM (Prev)" value={form.pastResultApm} min={0}
              onChange={(v) => setForm({ ...form, pastResultApm: (v as number) ?? 0 })} />
            <NumberInput label="PDP (Prev)" value={form.pastResultPdp} min={0}
              onChange={(v) => setForm({ ...form, pastResultPdp: (v as number) ?? 0 })} />
          </Group>
          <Group grow>
            <NumberInput label="APC (Prev)" value={form.pastResultApc} min={0}
              onChange={(v) => setForm({ ...form, pastResultApc: (v as number) ?? 0 })} />
            <NumberInput label="Other (Prev)" value={form.pastResultOther} min={0}
              onChange={(v) => setForm({ ...form, pastResultOther: (v as number) ?? 0 })} />
          </Group>
          <TextInput label="Agent Name" value={form.assignedAgentName}
            onChange={(e) => setForm({ ...form, assignedAgentName: e.currentTarget.value })} />
          <TextInput label="Agent Phone" value={form.assignedAgentPhone}
            onChange={(e) => setForm({ ...form, assignedAgentPhone: e.currentTarget.value })} />
          <Textarea label="Notes" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.currentTarget.value })} />
          <Button fullWidth onClick={handleSave} style={{ background: apmBlue }} mt="sm">
            Save Changes
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
