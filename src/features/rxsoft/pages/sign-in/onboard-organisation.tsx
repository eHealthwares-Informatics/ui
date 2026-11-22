import {
  Box,
  Button,
  Group,
  PasswordInput,
  Progress,
  Text,
  TextInput,
  Stack,
  Loader,
} from '@mantine/core';
import { Building2, User, Lock, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import z from 'zod';
import { resolvePostLoginTarget } from '@/features/shared/module-landing/post-login-target';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { identityApi } from '@/lib/identity-api';
import { useAuthStore } from '@/stores/auth-store';

type OnboardPayload = {
  code: string;
  name: string;
  password: string;
  ownerEmail: string;
};

type FieldName = 'name' | 'code' | 'email' | 'password';

const onboardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please enter your organisation name')
    .max(120, 'Organisation name must be 120 characters or fewer'),
  code: z
    .string()
    .trim()
    .min(2, 'Organisation code must be at least 2 characters')
    .max(40, 'Organisation code must be 40 characters or fewer')
    .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, digits, underscore or dash only'),
  email: z
    .string()
    .trim()
    .min(1, 'Please enter an admin email')
    .email('Please enter a valid admin email address'),
  password: z.string().min(1, 'Please choose an admin password').max(128, 'Password is too long'),
});

// Provisioning is asynchronous (202 + poll). The backend stage names mirror
// identity's `PROVISION_STAGE_NAMES`; keep this list in the same order.
const PROVISION_STAGES = [
  'identity',
  'emr',
  'identity-access',
  'backend-items',
  'backend-config',
  'backend-pricelist',
  'backend-stock-locations',
  'backend-lots',
  'backend-balances',
  'backend-parties',
  'backend-pos',
] as const;

const STAGE_LABELS: Record<string, string> = {
  identity: 'Creating your organisation & locations (identity)…',
  emr: 'Provisioning EMR departments, wards & demo patients…',
  'identity-access': 'Setting up roles, permissions & users (identity)…',
  'backend-items': 'Whitelisting catalogue items (rxsoft)…',
  'backend-config': 'Applying organisation configuration (rxsoft)…',
  'backend-pricelist': 'Building the retail price list (rxsoft)…',
  'backend-stock-locations': 'Preparing warehouses & stock locations (rxsoft)…',
  'backend-lots': 'Creating stock lots (rxsoft)…',
  'backend-balances': 'Preparing opening stock balances (rxsoft)…',
  'backend-parties': 'Creating demo parties (rxsoft)…',
  'backend-pos': 'Creating POS configurations (rxsoft)…',
};

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 15 * 60_000;

type ProvisionStatus = {
  exists: boolean;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'not_found';
  stage?: string | null;
  stages?: Array<{ name: string; status: string; count: number; error?: string }>;
  error?: string | null;
};

type ProvisionJob = {
  organizationCode: string;
  status?: string;
};

const inputStyle = {
  input: {
    height: 48,
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
} as const;

function fieldError(message?: string, testId?: string) {
  if (!message) {
    return null;
  }
  return (
    <Text size="xs" style={{ color: '#DC2626' }} mt={4} data-testid={testId}>
      {message}
    </Text>
  );
}

/**
 * "Onboard your Organisation" — self-serve tenant setup on the login page.
 *
 * Calls identity's @Public() POST /auth/onboard-organization, which natively
 * provisions the full tenant (identity roles/users, rxsoft catalogue, price
 * list, stock, parties, POS configs and EMR departments/wards), then
 * automatically signs the new organisation owner in and redirects to the app.
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [stageName, setStageName] = useState<string>('identity');
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [alreadyProvisioned, setAlreadyProvisioned] = useState(false);

  const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

  /**
   * Poll the durable provisioning job until it completes/fails. The backend
   * runs the heavy catalogue writes in the background with per-stage cursors,
   * so this request is short and safe behind the gateway timeout.
   */
  const waitForProvisioning = async (orgCode: string): Promise<boolean> => {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      try {
        const { data } = await identityApi.get<ProvisionStatus>(
          `/provision/status/${encodeURIComponent(orgCode)}`
        );
        if (data.stage) {
          setStageName(data.stage);
        }
        if (data.status === 'completed') {
          return true;
        }
        if (data.status === 'failed' || data.status === 'not_found') {
          setError(data.error || 'Organisation provisioning failed. Please retry.');
          return false;
        }
      } catch {
        // Transient poll failure — keep trying until the deadline.
      }
      await sleep(POLL_INTERVAL_MS);
    }
    setError(
      'Provisioning is taking longer than expected. You can retry without re-entering your details.'
    );
    return false;
  };

  const finishAndRedirect = async (email: string, pwd: string) => {
    await login(email, pwd);
    if (!useAuthStore.getState().user) {
      setError('Organisation created — please sign in with your new credentials.');
      onBack(email);
      return;
    }
    const authState = useAuthStore.getState();
    // Same post-login landing rule as the sign-in form: a single module goes
    // straight to its dashboard, otherwise the module chooser.
    window.location.href = resolvePostLoginTarget(
      undefined,
      authState.modules.map((m) => m.id)
    );
  };

  const retryProvisioning = async () => {
    if (!activeCode) {
      return;
    }
    setRunning(true);
    setError(null);
    setSummary(null);
    try {
      await identityApi.post(`/provision/${encodeURIComponent(activeCode)}/resume`);
      const completed = await waitForProvisioning(activeCode);
      if (!completed) {
        return;
      }
      await finishAndRedirect(ownerEmail.trim().toLowerCase(), password);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSummary(null);
    setFieldErrors({});
    setAlreadyProvisioned(false);

    const parsed = onboardSchema.safeParse({ name, code, email: ownerEmail, password });
    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName | undefined;
        if (key && !next[key]) {
          next[key] = issue.message;
        }
      }
      setFieldErrors(next);
      setSummary('Please fix the highlighted fields and try again.');
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const payload: OnboardPayload = {
      code: parsed.data.code.toUpperCase(),
      name: parsed.data.name,
      password: parsed.data.password,
      ownerEmail: email,
    };

    setStageName('identity');
    setActiveCode(null);
    setRunning(true);
    try {
      const { data } = await identityApi.post<ProvisionJob>('/auth/onboard-organization', payload);
      const orgCode = data.organizationCode ?? payload.code;
      setActiveCode(orgCode);

      const completed = await waitForProvisioning(orgCode);
      if (!completed) {
        return;
      }
      await finishAndRedirect(email, password);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        // Organisation already fully provisioned — move to the sign-in step
        // instead of surfacing an error.
        setAlreadyProvisioned(true);
        return;
      }
      setError(getApiErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  const stageIndex = Math.max(0, PROVISION_STAGES.indexOf(stageName as never));
  const stageLabel = STAGE_LABELS[stageName] ?? 'Provisioning your organisation…';
  const progressValue = ((stageIndex + 1) / PROVISION_STAGES.length) * 100;

  if (alreadyProvisioned) {
    return (
      <Stack gap="md" data-testid="onboard-org-already">
        <Group gap="xs">
          <CheckCircle2 size={22} color="#10B981" />
          <Text fw={600} size="lg" style={{ color: '#0F172A' }}>
            Organisation already provisioned
          </Text>
        </Group>
        <Text size="sm" style={{ color: '#64748B' }}>
          Organisation "{code.trim().toUpperCase()}" already exists. Please sign in with your
          credentials — the admin email you entered is pre-filled for you.
        </Text>
        <Button
          fullWidth
          size="lg"
          data-testid="onboard-org-already-back"
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
    <form onSubmit={submit} noValidate data-testid="onboard-organisation-form">
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
            data-testid="onboard-org-name"
            placeholder="e.g. My Pharmacy"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            leftSection={<Building2 size={18} color="#9CA3AF" />}
            styles={inputStyle}
            disabled={running}
            aria-invalid={Boolean(fieldErrors.name)}
          />
          {fieldError(fieldErrors.name, 'onboard-org-name-error')}
        </Box>

        <Box>
          <Text fw={500} size="sm" mb={6} style={{ color: '#374151' }}>
            Organisation code
          </Text>
          <TextInput
            data-testid="onboard-org-code"
            placeholder="e.g. MYPHARM"
            value={code}
            onChange={(e) => setCode(e.currentTarget.value.toUpperCase())}
            leftSection={<Sparkles size={18} color="#9CA3AF" />}
            styles={inputStyle}
            disabled={running}
            aria-invalid={Boolean(fieldErrors.code)}
          />
          <Text size="xs" style={{ color: '#9CA3AF' }} mt={4}>
            Letters, digits, underscore and dash. Used to prefix your roles and users.
          </Text>
          {fieldError(fieldErrors.code, 'onboard-org-code-error')}
        </Box>

        <Box>
          <Text fw={500} size="sm" mb={6} style={{ color: '#374151' }}>
            Admin email
          </Text>
          <TextInput
            data-testid="onboard-org-email"
            type="email"
            placeholder="e.g. admin@mypharm.com"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.currentTarget.value)}
            leftSection={<User size={18} color="#9CA3AF" />}
            styles={inputStyle}
            disabled={running}
            aria-invalid={Boolean(fieldErrors.email)}
          />
          <Text size="xs" style={{ color: '#9CA3AF' }} mt={4}>
            Your login email. Must be unique across the platform.
          </Text>
          {fieldError(fieldErrors.email, 'onboard-org-email-error')}
        </Box>

        <Box>
          <Text fw={500} size="sm" mb={6} style={{ color: '#374151' }}>
            Password
          </Text>
          <PasswordInput
            data-testid="onboard-org-password"
            placeholder="Choose an admin password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            leftSection={<Lock size={18} color="#9CA3AF" />}
            styles={inputStyle}
            disabled={running}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {fieldError(fieldErrors.password, 'onboard-org-password-error')}
        </Box>

        {summary && (
          <Text size="sm" style={{ color: '#DC2626' }} data-testid="onboard-org-error-summary">
            {summary}
          </Text>
        )}

        {error && (
          <Text size="sm" style={{ color: '#DC2626' }} data-testid="onboard-org-error">
            {error}
          </Text>
        )}

        {error && activeCode && !running && (
          <Button
            variant="light"
            color="teal"
            fullWidth
            data-testid="onboard-org-retry"
            onClick={() => void retryProvisioning()}
          >
            Retry provisioning
          </Button>
        )}

        <Button
          type="submit"
          loading={running}
          data-testid="onboard-org-submit"
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
          <Stack gap="xs" data-testid="onboard-org-progress">
            <Group gap="xs">
              <Loader size="xs" color="#10B981" />
              <Text size="sm" fw={500} style={{ color: '#0F172A' }} data-testid="onboard-org-stage">
                {stageLabel}
              </Text>
            </Group>
            <Progress
              value={progressValue}
              animated
              striped
              color="#10B981"
              size="sm"
              radius="sm"
            />
            <Text size="xs" style={{ color: '#9CA3AF' }}>
              Provisioning runs in the background across the identity, rxsoft and EMR backends. You
              can safely leave this tab — progress is saved and can be resumed.
            </Text>
          </Stack>
        )}

        <Button
          variant="subtle"
          fullWidth
          data-testid="onboard-org-back"
          onClick={() => {
            setError(null);
            setSummary(null);
            setFieldErrors({});
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
