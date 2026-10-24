import {
  Alert,
  Box,
  Button,
  Card,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useState, type FormEvent } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { hasPosPermission } from '../permissions';
import PharmacyPOS from '../pos';

/**
 * `/shop/pos` entry point. Missing/expired sessions are common behind a till
 * (tokens expire, staff share the browser), so instead of bouncing to the admin
 * sign-in page we show a compact username/password login right here. The POS
 * itself only mounts once authenticated.
 */
export function PosAuthGate() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <PosQuickLogin />;
  }
  if (!hasPosPermission(user.permissions ?? [], user.roles ?? [])) {
    return <PosAccessDenied />;
  }
  return <PharmacyPOS />;
}

function PosQuickLogin() {
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const storeError = useAuthStore((s) => s.error);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setLocalError('Enter your username and password.');
      return;
    }
    setLocalError(null);
    // `login` stores the tokens/user (and the 'Invalid credentials' error).
    await login(username.trim(), password, true);
  };

  const error = localError ?? storeError;

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: '#F7FBF9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <form onSubmit={(event) => void submit(event)} style={{ width: '100%', maxWidth: 420 }}>
        <Card withBorder radius={24} p="xl">
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={2}>Pharmacy POS</Title>
              <Text size="sm" c="dimmed">
                Sign in to start a sale — your session expired or you are not signed in.
              </Text>
            </Stack>

            {error ? <Alert color="red">{error}</Alert> : null}

            <TextInput
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.currentTarget.value)}
              autoFocus
              required
              data-testid="pos-quick-login-username"
            />
            <PasswordInput
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              data-testid="pos-quick-login-password"
            />
            <Button
              type="submit"
              color="green"
              radius="xl"
              loading={loading}
              data-testid="pos-quick-login-submit"
            >
              Sign in
            </Button>
          </Stack>
        </Card>
      </form>
    </Box>
  );
}

function PosAccessDenied() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: '#F7FBF9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card withBorder radius={24} p="xl" w={420}>
        <Stack gap="md">
          <Stack gap={4}>
            <Title order={3}>No POS access</Title>
            <Text size="sm" c="dimmed">
              This account does not have permission to use the Point of Sale.
            </Text>
          </Stack>
          <Button variant="light" onClick={logout} data-testid="pos-no-access-signout">
            Sign out
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
