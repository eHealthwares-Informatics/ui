import { useState } from 'react';
import { Box, Button, Group, PasswordInput, Text, TextInput, Stack, Loader } from '@mantine/core';
import { Building2, User, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { identityApi } from '@/lib/identity-api';
import { useAuthStore } from '@/stores/auth-store';

type OnboardPayload = {
  code: string;
  name: string;
  password: string;
  ownerEmail: string;
};

const inputStyle = {
  input: {
    height: 48,
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
} as const;

/**
 * "Onboard your Organisation" — self-serve tenant setup on the login page.
 *
 * Calls identity's @Public() POST /auth/onboard-organization (which forwards
 * to the seed service provisioning module), then automatically signs the new
 * organisation owner in and redirects to the app.
 */
export function OnboardOrganisation({ onBack }: { onBack: () => void }) {
  const login = useAuthStore((state) => state.login);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const email = ownerEmail.trim().toLowerCase();
    if (!code.trim() || !name.trim() || !password) {
      setError('Organisation code, name, email and password are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid admin email address.');
      return;
    }

    const payload: OnboardPayload = {
      code: code.trim(),
      name: name.trim(),
      password,
      ownerEmail: email,
    };

    setRunning(true);
    try {
      await identityApi.post('/auth/onboard-organization', payload);
      await login(email, password);
      if (!useAuthStore.getState().user) {
        setError('Organisation created — please sign in with your new credentials.');
        onBack();
        return;
      }
      const authState = useAuthStore.getState();
      const firstModule = authState.modules[0];
      const targetUrl = firstModule?.root || '/';
      window.location.href = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Onboarding failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <Group gap="xs">
          <Building2 size={18} color="#10B981" />
          <Box>
            <Text fw={600} size="lg" style={{ color: '#0F172A' }}>
              Onboard your Organisation
            </Text>
            <Text size="sm" style={{ color: '#64748B' }}>
              Create your organisation, admin account and reference data
            </Text>
          </Box>
        </Group>

        <Box>
          <Text fw={500} size="sm" mb={6} style={{ color: '#374151' }}>
            Organisation name
          </Text>
          <TextInput
            placeholder="e.g. My Pharmacy"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            leftSection={<Building2 size={18} color="#9CA3AF" />}
            styles={inputStyle}
          />
        </Box>

        <Box>
          <Text fw={500} size="sm" mb={6} style={{ color: '#374151' }}>
            Organisation code
          </Text>
          <TextInput
            placeholder="e.g. MYPHARM"
            value={code}
            onChange={(e) => setCode(e.currentTarget.value.toUpperCase())}
            leftSection={<Sparkles size={18} color="#9CA3AF" />}
            styles={inputStyle}
          />
          <Text size="xs" style={{ color: '#9CA3AF' }} mt={4}>
            Letters, digits, underscore and dash. Used to prefix your roles and users.
          </Text>
        </Box>

        <Box>
          <Text fw={500} size="sm" mb={6} style={{ color: '#374151' }}>
            Admin email
          </Text>
          <TextInput
            type="email"
            placeholder="e.g. admin@mypharm.com"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.currentTarget.value)}
            leftSection={<User size={18} color="#9CA3AF" />}
            styles={inputStyle}
          />
          <Text size="xs" style={{ color: '#9CA3AF' }} mt={4}>
            Your login email. Must be unique across the platform.
          </Text>
        </Box>

        <Box>
          <Text fw={500} size="sm" mb={6} style={{ color: '#374151' }}>
            Password
          </Text>
          <PasswordInput
            placeholder="Choose an admin password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            leftSection={<Lock size={18} color="#9CA3AF" />}
            styles={inputStyle}
          />
        </Box>

        {error && (
          <Text size="sm" style={{ color: '#DC2626' }}>
            {error}
          </Text>
        )}

        <Button
          type="submit"
          loading={running}
          leftSection={running ? undefined : <Building2 size={18} />}
          fullWidth
          size="lg"
          style={{
            height: 48,
            borderRadius: '8px',
            backgroundColor: '#10B981',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          {running ? <Loader size={18} color="white" /> : 'Onboard Organisation'}
        </Button>

        <Button
          variant="subtle"
          fullWidth
          onClick={() => {
            setError(null);
            onBack();
          }}
          leftSection={<ArrowLeft size={16} />}
          style={{ color: '#64748B' }}
        >
          Back to sign in
        </Button>
      </Stack>
    </form>
  );
}