import { Alert, Badge, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { emrPublicApi } from '@/lib/emr-public-api';

export type AuthPatientValue = {
  patientId: string;
  name: string;
  phone: string | null;
  proof?: string;
};

type OtpRequestResponse = {
  challengeId: string;
  expiresAt: string;
  patient: { patientId: string; name: string; phone: string | null };
};

type OtpVerifyResponse = {
  patient: { patientId: string; name: string; phone: string | null };
  patientId: string;
  patientProof: string | null;
};

/**
 * Patient picker that verifies ownership of the patient's phone via OTP before
 * accepting the selection. Used in staff forms and public form links.
 */
export function AuthPatientPicker({
  value,
  onChange,
  label = 'Patient',
  required = false,
  publicToken,
  disabled = false,
}: {
  value: AuthPatientValue | null;
  onChange: (value: AuthPatientValue | null) => void;
  label?: string;
  required?: boolean;
  publicToken?: string;
  disabled?: boolean;
}) {
  const [phone, setPhone] = useState('');
  const [mrn, setMrn] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const client = publicToken ? emrPublicApi : emrApi;
  const otpPath = publicToken ? `/public/forms/${publicToken}/otp` : '/patient-auth/otp';
  const verifyPath = publicToken
    ? `/public/forms/${publicToken}/otp/verify`
    : '/patient-auth/otp/verify';
  const identityPath = publicToken ? `/public/forms/${publicToken}/verify` : '/patient-auth/verify';

  const sendCode = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const { data } = await client.post<OtpRequestResponse>(otpPath, {
        phone: phone.trim(),
        mrn: mrn.trim() || undefined,
      });
      setChallengeId(data.challengeId);
      setNotice(`Code sent to ${phone.trim()}`);
    } catch (err) {
      setError(thisErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!challengeId) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { data } = await client.post<OtpVerifyResponse>(verifyPath, {
        challengeId,
        code: code.trim(),
      });
      onChange({
        patientId: data.patientId,
        name: data.patient.name,
        phone: data.patient.phone,
        proof: data.patientProof ?? undefined,
      });
      setNotice(null);
      setChallengeId(null);
      setCode('');
    } catch (err) {
      setError(thisErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const verifyIdentity = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const { data } = await client.post<OtpVerifyResponse>(identityPath, {
        phone: phone.trim(),
        mrn: mrn.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
      });
      onChange({
        patientId: data.patientId,
        name: data.patient.name,
        phone: data.patient.phone,
        proof: data.patientProof ?? undefined,
      });
      setNotice(null);
      setChallengeId(null);
      setCode('');
    } catch (err) {
      setError(thisErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (value) {
    return (
      <Stack gap={4}>
        <Text size="sm" fw={500}>
          {label}
          {required ? ' *' : ''}
        </Text>
        <Group gap="xs">
          <Badge color="teal" variant="light" leftSection={<ShieldCheck size={12} />}>
            Verified
          </Badge>
          <Text size="sm" fw={500}>
            {value.name}
          </Text>
          <Text size="xs" c="dimmed">
            {value.patientId}
            {value.phone ? ` · ${value.phone}` : ''}
          </Text>
          <Button
            size="compact-xs"
            variant="subtle"
            disabled={disabled}
            onClick={() => onChange(null)}
            data-testid="auth-patient-change"
          >
            Change
          </Button>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <Group align="flex-end" gap="xs" wrap="wrap">
        <TextInput
          label="Phone number"
          placeholder="+234…"
          value={phone}
          onChange={(event) => setPhone(event.currentTarget.value)}
          disabled={disabled || busy}
          data-testid="auth-patient-phone"
          style={{ flex: 1, minWidth: 180 }}
        />
        <TextInput
          label="MRN (optional)"
          placeholder="Only if the phone matches several patients"
          value={mrn}
          onChange={(event) => setMrn(event.currentTarget.value)}
          disabled={disabled || busy}
          data-testid="auth-patient-mrn"
          style={{ flex: 1, minWidth: 200 }}
        />
        <TextInput
          label="Date of birth (optional)"
          type="date"
          value={dateOfBirth}
          onChange={(event) => setDateOfBirth(event.currentTarget.value)}
          disabled={disabled || busy}
          data-testid="auth-patient-dob"
          style={{ flex: 1, minWidth: 170 }}
        />
        <Button
          variant="light"
          loading={busy}
          disabled={!phone.trim() || disabled}
          onClick={sendCode}
          data-testid="auth-patient-send-code"
        >
          Send code
        </Button>
        <Button
          variant="outline"
          loading={busy}
          disabled={!phone.trim() || (!mrn.trim() && !dateOfBirth) || disabled}
          onClick={verifyIdentity}
          data-testid="auth-patient-verify-identity"
        >
          Verify with MRN/DOB
        </Button>
      </Group>

      {challengeId && (
        <Group align="flex-end" gap="xs" wrap="wrap">
          <TextInput
            label="Verification code"
            placeholder="6-digit code"
            value={code}
            onChange={(event) => setCode(event.currentTarget.value)}
            disabled={busy || disabled}
            data-testid="auth-patient-code"
            style={{ flex: 1, minWidth: 160 }}
          />
          <Button
            loading={busy}
            disabled={code.trim().length < 4 || disabled}
            onClick={verify}
            data-testid="auth-patient-verify"
          >
            Verify patient
          </Button>
        </Group>
      )}

      {notice && (
        <Text size="xs" c="teal">
          {notice}
        </Text>
      )}
      {error && (
        <Alert color="red" icon={<AlertCircle size={16} />}>
          {error}
        </Alert>
      )}
    </Stack>
  );
}

function thisErrorMessage(error: unknown): string {
  const candidate = error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const message = candidate?.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join('; ');
  }
  return message ?? candidate?.message ?? 'Request failed';
}
