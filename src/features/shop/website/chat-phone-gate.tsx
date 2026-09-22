import { useState } from 'react';
import { Alert, Anchor, Button, Group, PinInput, Stack, Text, TextInput } from '@mantine/core';
import { ArrowRight, Phone, ShieldCheck } from 'lucide-react';
import { useAuthStore } from './auth-store';
import { green, ink, muted } from './layout';
import { generateGuestPhone } from './chatbot-service';

export interface ChatPhoneGateResult {
  phone: string;
  guest: boolean;
}

/**
 * Collects the chat phone number. The shopper may either verify a real number
 * by OTP (which also registers the account) or skip and continue as a guest
 * with an automatically generated unique number.
 */
export function ChatPhoneGate(props: {
  onDone: (result: ChatPhoneGateResult) => void;
  compact?: boolean;
}) {
  const { onDone, compact } = props;
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleGuest = () => {
    onDone({ phone: generateGuestPhone(), guest: true });
  };

  const handleRequestOtp = async () => {
    const value = phone.trim();
    if (!value) {
      setError('Enter your phone number to continue.');
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      const res = await requestOtp(value);
      setOtpSent(true);
      setDevCode(res?.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    const value = phone.trim();
    if (!value || code.trim().length < 4) {
      setError('Enter the verification code.');
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      await verifyOtp(value, code.trim());
      onDone({ phone: value, guest: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      setBusy(false);
    }
  };

  const handleContinueUnverified = () => {
    const value = phone.trim();
    if (!value) {
      setError('Enter your phone number to continue.');
      return;
    }
    onDone({ phone: value, guest: true });
  };

  return (
    <Stack gap="sm" p={compact ? 0 : 'md'}>
      <Stack gap={4}>
        <Text fw={700} c={ink}>
          {otpSent ? 'Verify your number' : 'How can we reach you?'}
        </Text>
        <Text size="xs" c={muted} lh={1.5}>
          {otpSent
            ? `We sent a code to ${phone.trim()}. Enter it to save your chat history.`
            : 'Enter your phone number so we can keep your conversation and send updates. We will text you a one-time code.'}
        </Text>
      </Stack>

      {error && (
        <Alert color="red" py={6}>
          <Text size="xs">{error}</Text>
        </Alert>
      )}

      {!otpSent ? (
        <>
          <TextInput
            label="Phone number"
            placeholder="080 0000 0000"
            leftSection={<Phone size={15} />}
            value={phone}
            onChange={(event) => setPhone(event.currentTarget.value.replace(/[^0-9+]/g, ''))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleRequestOtp();
              }
            }}
            radius="md"
          />
          <Button
            radius="xl"
            loading={busy}
            onClick={() => void handleRequestOtp()}
            rightSection={<ArrowRight size={16} />}
            styles={{ root: { background: green } }}
          >
            Send code
          </Button>
        </>
      ) : (
        <>
          <Stack gap={6} align="center">
            <PinInput
              length={6}
              type="number"
              oneTimeCode
              value={code}
              onChange={setCode}
              size="md"
            />
            {devCode && (
              <Text size="xs" c={green} fw={700}>
                Dev code: {devCode}
              </Text>
            )}
          </Stack>
          <Button
            radius="xl"
            loading={busy}
            onClick={() => void handleVerify()}
            leftSection={<ShieldCheck size={16} />}
            styles={{ root: { background: green } }}
          >
            Verify and continue
          </Button>
          <Group justify="space-between">
            <Anchor size="xs" c={muted} onClick={() => setOtpSent(false)}>
              Change number
            </Anchor>
            <Anchor
              size="xs"
              c={muted}
              onClick={() => {
                if (!busy) {
                  void handleRequestOtp();
                }
              }}
            >
              Resend code
            </Anchor>
          </Group>
          <Anchor size="xs" c={muted} onClick={handleContinueUnverified}>
            Skip verification for now
          </Anchor>
        </>
      )}

      <Anchor
        size="xs"
        c={muted}
        onClick={handleGuest}
        underline="never"
        style={{ alignSelf: 'center', marginTop: 4 }}
      >
        I don&apos;t want to drop my phone number
      </Anchor>
    </Stack>
  );
}
