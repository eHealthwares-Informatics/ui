import {
  ActionIcon,
  Alert,
  AppShell,
  Button,
  Container,
  Flex,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft, ExternalLink, Moon, Sun, Users } from 'lucide-react';
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/clerk/_authenticated/user-management')({
  component: UserManagement,
});

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const users: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Editor',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'Viewer',
  },
];

function UserManagement() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dark, setDark] = useState(false);

  // Replace with your own auth check
  useEffect(() => {
    const token = localStorage.getItem('token');

    setTimeout(() => {
      setIsAuthenticated(!!token);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Loader size="lg" />
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return <Unauthorized />;
  }

  return (
    <AppShell padding="md">
      <AppShell.Header>
        <Flex h="100%" px="md" align="center" justify="space-between">
          <Group>
            <Users size={22} />
            <Title order={4}>User Management</Title>
          </Group>

          <Group>
            <ActionIcon variant="default" size="lg" onClick={() => setDark((v) => !v)}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </ActionIcon>

            <Button
              variant="light"
              color="red"
              onClick={() => {
                localStorage.removeItem('token');
                navigate({ to: '/sign-in' });
              }}
            >
              Sign Out
            </Button>
          </Group>
        </Flex>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Stack gap="lg">
            <Flex justify="space-between" align="center" wrap="wrap">
              <div>
                <Title order={2}>User List</Title>

                <Group gap={6} mt={4}>
                  <Text c="dimmed">Manage your users and their roles here.</Text>

                  <Link
                    to={'/users' as any}
                    style={{
                      color: '#228be6',
                      textDecoration: 'underline',
                    }}
                  >
                    Learn More
                  </Link>

                  <ExternalLink size={16} />
                </Group>
              </div>

              <Button>Add User</Button>
            </Flex>

            <Paper withBorder radius="md" p="md">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {users.map((user) => (
                    <Table.Tr key={user.id}>
                      <Table.Td>{user.id}</Table.Td>
                      <Table.Td>{user.name}</Table.Td>
                      <Table.Td>{user.email}</Table.Td>
                      <Table.Td>{user.role}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

const COUNTDOWN = 5;

function Unauthorized() {
  const navigate = useNavigate();
  const { history } = useRouter();

  const [cancelled, setCancelled] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN);

  useEffect(() => {
    if (cancelled) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [cancelled]);

  useEffect(() => {
    if (countdown === 0) {
      navigate({ to: '/sign-in' });
    }
  }, [countdown, navigate]);

  return (
    <Flex h="100vh" align="center" justify="center" p="md">
      <Paper shadow="md" radius="lg" p="xl" withBorder maw={500} w="100%">
        <Stack align="center">
          <Title order={1} fz="7rem">
            401
          </Title>

          <Title order={3}>Unauthorized Access</Title>

          <Text ta="center" c="dimmed">
            You must sign in to access this resource.
          </Text>

          <Alert variant="light" color="yellow" title="Authentication Required" w="100%">
            Sign in to continue to the protected route.
          </Alert>

          <Group mt="md">
            <Button
              variant="default"
              leftSection={<ArrowLeft size={16} />}
              onClick={() => history.go(-1)}
            >
              Go Back
            </Button>

            <Button onClick={() => navigate({ to: '/sign-in' })}>Sign In</Button>
          </Group>

          {!cancelled && (
            <Stack gap={4} align="center" mt="md">
              <Text size="sm">
                {countdown > 0 ? `Redirecting in ${countdown}s` : 'Redirecting...'}
              </Text>

              <Button variant="subtle" size="xs" onClick={() => setCancelled(true)}>
                Cancel Redirect
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Flex>
  );
}
