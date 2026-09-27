import {
  Box,
  Card,
  Grid,
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
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import {
  useLgaConversion,
  useUpdateConversionScore,
  useWardConversion,
} from '../website/admin-hooks';
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

function statusBadgeColor(status: string) {
  switch (status) {
    case 'green':
      return 'green';
    case 'yellow':
      return 'yellow';
    case 'red':
      return 'red';
    default:
      return 'gray';
  }
}

export function LgasPage() {
  const { data: lgas, isLoading } = useLgaConversion();
  const updateScore = useUpdateConversionScore();
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedLga, setSelectedLga] = useState<any>(null);
  const [score, setScore] = useState(50);
  const [status, setStatus] = useState('grey');
  const [notes, setNotes] = useState('');

  const openScoreModal = (lga: any) => {
    setSelectedLga(lga);
    setScore(lga.score);
    setStatus(lga.status);
    setNotes('');
    open();
  };

  const handleSaveScore = () => {
    if (!selectedLga) {
      return;
    }
    updateScore.mutate(
      {
        entityType: 'lga',
        entityId: selectedLga.id,
        data: { score, status, notes, assessedBy: 'admin' },
      },
      { onSuccess: close }
    );
  };

  return (
    <Stack gap="lg">
      <Title order={3} style={{ color: ink }}>
        LGA Conversion Overview
      </Title>

      {isLoading ? (
        <Skeleton height={400} radius="md" />
      ) : (
        <Card padding="lg" radius="md" withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>LGA</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Score</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Wards</Table.Th>
                <Table.Th>Polling Units</Table.Th>
                <Table.Th>APM-Friendly PUs</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(lgas ?? []).map((lga: any) => (
                <Table.Tr key={lga.id}>
                  <Table.Td>
                    <Text
                      fw={600}
                      style={{ color: apmBlue, cursor: 'pointer' }}
                      onClick={() => {
                        /* navigate to ward view */
                      }}
                    >
                      {lga.name}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ color: muted }}>{lga.code}</Table.Td>
                  <Table.Td>
                    <Text fw={700} style={{ color: statusColor(lga.status) }}>
                      {lga.score}%
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={statusBadgeColor(lga.status)}>{lga.status}</Badge>
                  </Table.Td>
                  <Table.Td>{lga.wardCount}</Table.Td>
                  <Table.Td>{lga.pollingUnitCount}</Table.Td>
                  <Table.Td>
                    <Text fw={700} style={{ color: '#16A34A' }}>
                      {lga.wonPollingUnits}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        style={{ color: apmBlue }}
                        onClick={() => openScoreModal(lga)}
                      >
                        Score
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        color="gray"
                        onClick={() => navigate({ to: `/apm/admin/wards/${lga.id}` })}
                      >
                        Wards
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {(lgas ?? []).length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={8} style={{ textAlign: 'center', color: muted }}>
                    No LGA data available. Seed the database first.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal opened={opened} onClose={close} title={`Score: ${selectedLga?.name ?? ''}`} size="sm">
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
