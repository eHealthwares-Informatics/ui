import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  Grid,
  Table,
  Button,
  Modal,
  TextInput,
  Select,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, useMemo } from 'react';
import {
  useIncidentStats,
  useIncidents,
  useCreateIncident,
  useUpdateIncident,
} from '../website/admin-hooks';
import { apmBlue, ink, muted } from '../website/layout';

export function IncidentsPage() {
  const { data: stats } = useIncidentStats();
  const createIncident = useCreateIncident();
  const updateIncident = useUpdateIncident();

  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page, limit: 20 };
    if (typeFilter) {
      p.category = typeFilter;
    }
    if (severityFilter) {
      p.severity = severityFilter;
    }
    if (statusFilter) {
      p.status = statusFilter;
    }
    return p;
  }, [typeFilter, severityFilter, statusFilter, page]);

  const { data: incidentsData } = useIncidents(params);

  const [opened, { open, close }] = useDisclosure(false);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState({
    pollingUnitId: '',
    type: 'other',
    description: '',
    severity: 'medium',
    reportedBy: '',
  });

  const statCards = [
    { label: 'Total Reports', value: stats?.total ?? 0, color: apmBlue },
    { label: 'Open', value: stats?.open ?? 0, color: '#EAB308' },
    { label: 'Critical', value: stats?.critical ?? 0, color: '#DC2626' },
    { label: 'Escalated', value: stats?.escalated ?? 0, color: '#8B5CF6' },
  ];

  const severityColor = (s: string) =>
    s === 'critical' ? 'red' : s === 'high' ? 'orange' : s === 'medium' ? 'yellow' : 'gray';
  const typeColor = (t: string) =>
    t === 'violence'
      ? 'red'
      : t === 'intimidation'
        ? 'orange'
        : t === 'rigging'
          ? 'pink'
          : t === 'equipment-failure'
            ? 'yellow'
            : 'gray';

  const handleCreate = () => {
    createIncident.mutate(form, {
      onSuccess: () => {
        close();
        setForm({
          pollingUnitId: '',
          type: 'other',
          description: '',
          severity: 'medium',
          reportedBy: '',
        });
      },
    });
  };

  const handleEscalate = (id: string, field: 'legalEscalation' | 'securityEscalation') => {
    updateIncident.mutate({ id, data: { [field]: true } });
  };

  const handleResolve = (id: string) => {
    updateIncident.mutate({ id, data: { status: 'resolved' } });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3} style={{ color: ink }}>
          Election Protection — Incident Reports
        </Title>
        <Button onClick={open} style={{ background: apmBlue }}>
          Report Incident
        </Button>
      </Group>

      <Grid>
        {statCards.map((s) => (
          <Grid.Col key={s.label} span={{ base: 6, sm: 4, md: 3 }}>
            <Card padding="md" radius="md" withBorder>
              <Stack gap={2} align="center">
                <Text size="xs" style={{ color: muted }}>
                  {s.label}
                </Text>
                <Text fw={800} style={{ fontSize: '1.5rem', color: s.color, lineHeight: 1.2 }}>
                  {s.value}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Group gap="sm">
        <Select
          placeholder="Type"
          clearable
          data={[
            { value: 'violence', label: 'Violence' },
            { value: 'intimidation', label: 'Intimidation' },
            { value: 'rigging', label: 'Rigging' },
            { value: 'equipment-failure', label: 'Equipment Failure' },
            { value: 'other', label: 'Other' },
          ]}
          value={typeFilter}
          onChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        />
        <Select
          placeholder="Severity"
          clearable
          data={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' },
          ]}
          value={severityFilter}
          onChange={(v) => {
            setSeverityFilter(v);
            setPage(1);
          }}
        />
        <Select
          placeholder="Status"
          clearable
          data={[
            { value: 'open', label: 'Open' },
            { value: 'resolved', label: 'Resolved' },
          ]}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
      </Group>

      <Card padding="lg" radius="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Type</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Severity</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Legal</Table.Th>
              <Table.Th>Security</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(incidentsData?.items ?? []).map((inc: any) => (
              <Table.Tr key={inc.id}>
                <Table.Td>
                  <Badge color={typeColor(inc.type)}>{inc.type}</Badge>
                </Table.Td>
                <Table.Td
                  style={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: muted,
                  }}
                >
                  {inc.description}
                </Table.Td>
                <Table.Td>
                  <Badge color={severityColor(inc.severity)}>{inc.severity}</Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      inc.status === 'resolved'
                        ? 'green'
                        : inc.status === 'open'
                          ? 'yellow'
                          : 'gray'
                    }
                  >
                    {inc.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {inc.legalEscalation ? (
                    <Badge color="violet">Yes</Badge>
                  ) : (
                    <Text style={{ color: muted }}>—</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {inc.securityEscalation ? (
                    <Badge color="red">Yes</Badge>
                  ) : (
                    <Text style={{ color: muted }}>—</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => {
                        setDetail(inc);
                        openDetail();
                      }}
                    >
                      View
                    </Button>
                    {inc.status !== 'resolved' && (
                      <>
                        {!inc.legalEscalation && (
                          <Button
                            size="xs"
                            variant="light"
                            color="violet"
                            onClick={() => handleEscalate(inc.id, 'legalEscalation')}
                          >
                            Legal
                          </Button>
                        )}
                        {!inc.securityEscalation && (
                          <Button
                            size="xs"
                            variant="light"
                            color="red"
                            onClick={() => handleEscalate(inc.id, 'securityEscalation')}
                          >
                            Security
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="light"
                          color="green"
                          onClick={() => handleResolve(inc.id)}
                        >
                          Resolve
                        </Button>
                      </>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {(incidentsData?.items ?? []).length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: 'center', color: muted }}>
                  No incidents match filters
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        {incidentsData && Math.ceil(incidentsData.total / 20) > 1 && (
          <Group justify="center" mt="md">
            <Button variant="light" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Text size="sm" style={{ color: muted }}>
              Page {page} of {Math.ceil(incidentsData.total / 20)}
            </Text>
            <Button
              variant="light"
              disabled={page >= Math.ceil(incidentsData.total / 20)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </Group>
        )}
      </Card>

      <Modal opened={detailOpened} onClose={closeDetail} title="Incident Detail" size="md">
        {detail && (
          <Stack gap="sm">
            <Text size="sm">
              <strong>Type:</strong> {detail.type}
            </Text>
            <Text size="sm">
              <strong>Severity:</strong> {detail.severity}
            </Text>
            <Text size="sm">
              <strong>Status:</strong> {detail.status}
            </Text>
            <Text size="sm">
              <strong>Reported By:</strong> {detail.reportedBy ?? '—'}
            </Text>
            <Text size="sm">
              <strong>Reported At:</strong>{' '}
              {detail.reportedAt ? new Date(detail.reportedAt).toLocaleString() : '—'}
            </Text>
            <Text size="sm">
              <strong>Description:</strong> {detail.description}
            </Text>
            <Text size="sm">
              <strong>Legal Escalation:</strong> {detail.legalEscalation ? 'Yes' : 'No'}
            </Text>
            <Text size="sm">
              <strong>Security Escalation:</strong> {detail.securityEscalation ? 'Yes' : 'No'}
            </Text>
            <Text size="sm">
              <strong>Notes:</strong> {detail.notes ?? '—'}
            </Text>
          </Stack>
        )}
      </Modal>

      <Modal opened={opened} onClose={close} title="Report Incident" size="md">
        <Stack gap="sm">
          <Select
            label="Type"
            data={[
              { value: 'violence', label: 'Violence' },
              { value: 'intimidation', label: 'Intimidation' },
              { value: 'rigging', label: 'Rigging' },
              { value: 'equipment-failure', label: 'Equipment Failure' },
              { value: 'other', label: 'Other' },
            ]}
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v ?? 'other' })}
            required
          />
          <Textarea
            label="Description"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.currentTarget.value })}
          />
          <Select
            label="Severity"
            data={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
            value={form.severity}
            onChange={(v) => setForm({ ...form, severity: v ?? 'medium' })}
          />
          <Select
            label="Reported By"
            data={[
              { value: 'Polling Agent', label: 'Polling Agent' },
              { value: 'Ward Supervisor', label: 'Ward Supervisor' },
              { value: 'Security Observer', label: 'Security Observer' },
              { value: 'Party Agent', label: 'Party Agent' },
            ]}
            value={form.reportedBy}
            onChange={(v) => setForm({ ...form, reportedBy: v ?? '' })}
          />
          <TextInput
            label="Polling Unit ID"
            value={form.pollingUnitId}
            onChange={(e) => setForm({ ...form, pollingUnitId: e.currentTarget.value })}
            placeholder="Optional"
          />
          <Button fullWidth onClick={handleCreate} style={{ background: apmBlue }} mt="sm">
            Submit Report
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
