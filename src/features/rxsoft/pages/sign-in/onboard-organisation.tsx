import { useEffect, useState } from 'react';
import { Box, Button, Group, PasswordInput, Progress, Text, TextInput, Stack, Loader } from '@mantine/core';
import { Building2, User, Lock, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { identityApi } from '@/lib/identity-api';
import { useAuthStore } from '@/stores/auth-store';

type OnboardPayload = {
  code: string;
  name: string;
  password: string;
  ownerEmail: string;
};

// Provisioning whitelists the whole catalogue, builds the price list, stock
// and EMR data in one call — allow up to 2 minutes for this request alone
// (the identity client's global 10s timeout still applies everywhere else).
const ONBOARD_TIMEOUT_MS = 120_000;
const STAGE_ADVANCE_MS = 3_000;

// Mirrors the actual provisioning order in identity's provision service:
// identity org/locations → EMR departments → roles/users → rxsoft catalogue,
// pricing, stock, parties & POS configs.
const PROVISIONING_STAGES = [
  'Creating your organisation & locations (identity)…',
  'Provisioning default EMR departments…',
  'Setting up roles, permissions & users (identity)…',
  'Whitelisting catalogue items & building the retail price list (rxsoft)…',
  'Preparing warehouses, stock locations & opening balances (rxsoft)…',
  'Creating demo parties & POS configurations (rxsoft)…',
  'Finalising your organisation…',
];

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
 * Calls identity's @Public() POST /auth/onboard-organization, which natively
 * provisions the full tenant (identity roles/users, rxsoft catalogue, price
 * list, stock, parties, POS configs and EMR departments), then automatically
 * signs the new organisation owner in and redirects to the app.
 *
 * Provisioning can take a while, so the request uses a 120s timeout while a
 * staged progress panel shows what is being provisioned. When the
 * organisation already exists (409), provisioning is skipped and the user is
 * prompted to sign in with their credentials instead.
 */
export function OnboardOrganisation({ onBack }: { onBack: (prefillUsername?: string) => void }) {
  const login = useAuthStore((state) => state.login);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0);
  const [alreadyProvisioned, setAlreadyProvisioned] = useState(false);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, PROVISIONING_STAGES.length - 1));
    }, STAGE_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setAlreadyProvisioned(false);

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

    setStage(0);
    setRunning(true);
    try {
      await identityApi.post('/auth/onboard-organization', payload, { timeout: ONBOARD_TIMEOUT_MS });
      await login(email, password);
      if (!useAuthStore.getState().user) {
        setError('Organisation created — please sign in with your new credentials.');
        onBack(email);
        return;
      }
      const authState = useAuthStore.getState();
      const firstModule = authState.modules[0];
      const targetUrl = firstModule?.root || '/';
      window.location.href = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
    } catch (err: any) {
      if (err?.response?.status === 409) {
        // Organisation code (or owner email) already provisioned — move to the
        // sign-in step instead of surfacing an error.
        setAlreadyProvisioned(true);
        return;
      }
      setError(err?.response?.data?.message ?? err?.message ?? 'Onboarding failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  if (alreadyProvisioned) {
    return (
      <Stack gap="md">
        <Group gap="xs">
          <CheckCircle2 size={22} color="#10B981" />
          <Text fw={600} size="lg" style={{ color: '#0F172A' }}>
            Organisation already provisioned
          </Text>
        </Group>
        <Text size="sm" style={{ color: '#64748B' }}>
          Organisation "{code.trim().toUpperCase()}" already exists. Please sign in with
          your credentials — the admin email you entered is pre-filled for you.
        </Text>
        <Button
          fullWidth
          size="lg"
          onClick={() => onBack(ownerEmail.trim().toLowerCase())}
          leftSection={<ArrowLeft size={16} />}
          style={{
            height: 48,
            borderRadius: '8px',
            backgroundColor: '#10B981',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Back to sign in
        </Button>
      </Stack>
    );
  }

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
            disabled={running}
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
            disabled={running}
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
            disabled={running}
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
            disabled={running}
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

        {running && (
          <Stack gap="xs">
            <Group gap="xs">
              <Loader size="xs" color="#10B981" />
              <Text size="sm" fw={500} style={{ color: '#0F172A' }}>
                {PROVISIONING_STAGES[stage]}
              </Text>
            </Group>
            <Progress
              value={((stage + 1) / PROVISIONING_STAGES.length) * 100}
              animated
              striped
              color="#10B981"
              size="sm"
              radius="sm"
            />
            <Text size="xs" style={{ color: '#9CA3AF' }}>
              Provisioning runs across the identity, rxsoft and EMR backends. This can
              take up to 2 minutes — please keep this tab open.
            </Text>
          </Stack>
        )}

        <Button
          variant="subtle"
          fullWidth
          onClick={() => {
            setError(null);
            onBack();
          }}
          leftSection={<ArrowLeft size={16} />}
          style={{ color: '#64748B' }}
          disabled={running}
        >
          Back to sign in
        </Button>
      </Stack>
    </form>
  );
}
