import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  Tooltip,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import {
  approveRoleRequest,
  listAllRoleRequests,
  listRoleCatalog,
  rejectRoleRequest,
  RoleRequest,
} from '../user-insights/api';

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

  // Dedupe by code: the catalog may repeat a role code across org/global scopes
  // and Mantine's Select throws on duplicate option values.
  const roleOptions = Array.from(
    new Map(roleCatalog.map((r) => [r.code, { value: r.code, label: r.name || r.code }])).values(),
  );

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
                <Text c="dimmed" size="sm">
                  Loading…
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : requests.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" size="sm">
                  No role requests.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            requests.map((req) => (
              <Table.Tr key={req.id}>
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="sm" fw={500} data-testid={`role-request-user-${req.id}`}>
                      {req.userName ?? 'User'}
                    </Text>
                    {req.userEmail ? (
                      <Text size="xs" c="dimmed">
                        {req.userEmail}
                      </Text>
                    ) : null}
                  </Stack>
                </Table.Td>
                <Table.Td>{req.roleCode}</Table.Td>
                <Table.Td>
                  <Badge size="sm" variant="light" color={STATUS_COLOR[req.status]}>
                    {req.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{new Date(req.createdAt).toLocaleString()}</Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="nowrap">
                    <Tooltip label="Approve">
                      <ActionIcon
                        color="green"
                        variant="light"
                        size="sm"
                        aria-label="Approve request"
                        data-testid={`role-request-approve-${req.id}`}
                        disabled={req.status !== 'pending'}
                        onClick={() => {
                          setDeciding(req);
                          setOverrideRole(null);
                        }}
                      >
                        <Check size={14} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Reject">
                      <ActionIcon
                        color="red"
                        variant="light"
                        size="sm"
                        aria-label="Reject request"
                        data-testid={`role-request-reject-${req.id}`}
                        disabled={req.status !== 'pending'}
                        loading={decide.isPending}
                        onClick={() => decide.mutate({ id: req.id, action: 'reject' })}
                      >
                        <X size={14} />
                      </ActionIcon>
                    </Tooltip>
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
            data={roleOptions}
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
