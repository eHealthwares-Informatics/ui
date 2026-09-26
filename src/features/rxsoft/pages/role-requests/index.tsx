import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  approveRoleRequest,
  listAllRoleRequests,
  listRoleCatalog,
  rejectRoleRequest,
  RoleRequest,
} from '../user-insights/api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

const STATUS_COLOR: Record<RoleRequest['status'], string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
};

export function RoleRequestsPage() {
  const qc = useQueryClient();
  const [deciding, setDeciding] = useState<RoleRequest | null>(null);
  const [overrideRole, setOverrideRole] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['role-requests-all'],
    queryFn: listAllRoleRequests,
  });

  const { data: roleCatalog = [] } = useQuery({
    queryKey: ['role-catalog-admin'],
    queryFn: listRoleCatalog,
  });

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      action === 'approve'
        ? approveRoleRequest(id, overrideRole ?? undefined)
        : rejectRoleRequest(id),
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Updated' });
      setDeciding(null);
      setOverrideRole(null);
      qc.invalidateQueries({ queryKey: ['role-requests-all'] });
    },
    onError: (e: any) =>
      notifications.show({
        color: 'red',
        message: getApiErrorMessage(e),
        }),
  });

  return (
    <Card withBorder radius="md" p="lg">
      <Title order={4} mb={4}>
        Roles Request
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        Accept a request to add the role to the user, or reject it. On approval you may change the
        role being assigned.
      </Text>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>User</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Requested</Table.Th>
            <Table.Th w={150}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" size="sm">Loading…</Text>
              </Table.Td>
            </Table.Tr>
          ) : requests.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" size="sm">No role requests.</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            requests.map((req) => (
              <Table.Tr key={req.id}>
                <Table.Td>{req.userId.slice(0, 8)}</Table.Td>
                <Table.Td>{req.roleCode}</Table.Td>
                <Table.Td>
                  <Badge size="sm" variant="light" color={STATUS_COLOR[req.status]}>
                    {req.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{new Date(req.createdAt).toLocaleString()}</Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="nowrap">
                    <Button
                      size="compact-xs"
                      color="green"
                      disabled={req.status !== 'pending'}
                      onClick={() => {
                        setDeciding(req);
                        setOverrideRole(null);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="compact-xs"
                      color="red"
                      variant="light"
                      disabled={req.status !== 'pending'}
                      loading={decide.isPending}
                      onClick={() => decide.mutate({ id: req.id, action: 'reject' })}
                    >
                      Reject
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Modal
        opened={!!deciding}
        onClose={() => setDeciding(null)}
        title={`Approve role request — ${deciding?.roleCode ?? ''}`}
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Assigning this role to the user adds it to their existing roles.
          </Text>
          <Select
            label="Role to assign"
            data={roleCatalog.map((r) => ({ value: r.code, label: r.name || r.code }))}
            value={overrideRole ?? deciding?.roleCode ?? null}
            onChange={setOverrideRole}
            searchable
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button
              color="green"
              loading={decide.isPending}
              disabled={!deciding}
              onClick={() => deciding && decide.mutate({ id: deciding.id, action: 'approve' })}
            >
              Approve
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}