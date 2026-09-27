import {
  Box,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
  Badge,
  Table,
  Button,
  Modal,
  Slider,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useWardConversion, useUpdateConversionScore, useLgas } from '../website/admin-hooks';
import { apmBlue, ink, muted } from '../website/layout';

function statusColor(status: string) {
  switch (status) {
    case 'green':
      return '#16A34A';
    case 'yellow':
      return '#EAB308';
    case 'red':
      return '#DC2626';
    case 'grey':
      return '#94A3B8';
    default:
      return '#94A3B8';
  }
}

export function WardsPage() {
  const { lgaId } = useParams({ from: '/apm/admin/wards/$lgaId' });
  const { data: wards, isLoading } = useWardConversion(lgaId);
  const { data: lgas } = useLgas();
  const updateScore = useUpdateConversionScore();
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedWard, setSelectedWard] = useState<any>(null);
  const [score, setScore] = useState(50);
  const [status, setStatus] = useState('grey');
  const [notes, setNotes] = useState('');

  const lgaName = (lgas ?? []).find((l: any) => l.id === lgaId)?.name ?? 'Unknown';

  const openScoreModal = (ward: any) => {
    setSelectedWard(ward);
    setScore(ward.score);
    setStatus(ward.status);
    setNotes('');
    open();
  };

  const handleSaveScore = () => {
    if (!selectedWard) {
      return;
    }
    updateScore.mutate(
      {
        entityType: 'ward',
        entityId: selectedWard.id,
        data: { score, status, notes, assessedBy: 'admin' },
      },
      { onSuccess: close }
    );
  };

  return (
    <Stack gap="lg">
      <Group>
        <Button variant="subtle" onClick={() => navigate({ to: '/apm/admin/lgas' })}>
          ← Back to LGAs
        </Button>
        <Title order={3} style={{ color: ink }}>
          {lgaName} — Wards
        </Title>
      </Group>

      {isLoading ? (
        <Skeleton height={400} radius="md" />
      ) : (
        <Card padding="lg" radius="md" withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ward</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Score</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Polling Units</Table.Th>
                <Table.Th>APM-Friendly PUs</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(wards ?? []).map((ward: any) => (
                <Table.Tr key={ward.id}>
                  <Table.Td fw={600}>{ward.name}</Table.Td>
                  <Table.Td style={{ color: muted }}>{ward.code}</Table.Td>
                  <Table.Td>
                    <Text fw={700} style={{ color: statusColor(ward.status) }}>
                      {ward.score}%
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        ward.status === 'green'
                          ? 'green'
                          : ward.status === 'yellow'
                            ? 'yellow'
                            : ward.status === 'red'
                              ? 'red'
                              : 'gray'
                      }
                    >
                      {ward.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{ward.pollingUnitCount}</Table.Td>
                  <Table.Td>
                    <Text fw={700} style={{ color: '#16A34A' }}>
                      {ward.wonPollingUnits}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        style={{ color: apmBlue }}
                        onClick={() => openScoreModal(ward)}
                      >
                        Score
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        color="gray"
                        onClick={() => navigate({ to: `/apm/admin/polling-units/${ward.id}` })}
                      >
                        PUs
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {(wards ?? []).length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center', color: muted }}>
                    No ward data found for this LGA
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal opened={opened} onClose={close} title={`Score: ${selectedWard?.name ?? ''}`} size="sm">
        <Stack gap="md">
          <Text size="sm" style={{ color: muted }}>
            Conversion Score: {score}%
          </Text>
          <Slider
            value={score}
            onChange={setScore}
            min={0}
            max={100}
            label={`${score}%`}
            styles={{ markLabel: { fontSize: 11 } }}
          />
          <Group>
            {['green', 'yellow', 'red', 'grey'].map((s) => (
              <Badge
                key={s}
                style={{
                  cursor: 'pointer',
                  background: status === s ? statusColor(s) : '#E2E8F0',
                  color: status === s ? '#fff' : muted,
                  padding: '6px 12px',
                }}
                onClick={() => setStatus(s)}
              >
                {s}
              </Badge>
            ))}
          </Group>
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
          <Button fullWidth onClick={handleSaveScore} style={{ background: apmBlue }}>
            Save Score
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
