import {
  Alert,
  Button,
  Group,
  Modal,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Phone, Lock, KeyRound, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useAuthStore } from '../website/auth-store';
import { green, ink, muted, line, buttonStyles } from '../website/components';

interface CheckoutPhoneLoginModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Phone number collected on the delivery tab, prefilled into the field. */
  phone: string;
}

/**
 * Sign-in / auto-register modal shown when a shopper enters a phone number on
 * the delivery tab but is not yet authenticated.
 *
 * OTP (primary): request a code, then verify it. The backend
 * (`POST /website/auth/otp/verify`) auto-creates a phone-only `website_user`
 * account when none exists, so this path registers + logs in automatically.
 *
 * Password (fallback): log in with the phone's existing password. If the
 * account does not exist yet, auto-register it (username = phone) and log in.
 *
 * Either way the JWT is persisted by `useAuthStore` before `onSuccess` fires,
 * so the subsequent `/payments/initialize` call carries the bearer token.
 */
export function CheckoutPhoneLoginModal({
  opened,
  onClose,
  onSuccess,
  phone: initialPhone,
}: CheckoutPhoneLoginModalProps) {
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [phone, setPhone] = useState(initialPhone);
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const handleRequestOtp = async () => {
    const value = phone.trim();
    if (!value) {
      setError('Enter your phone number.');
      return;
    }
    clearError();
    setBusy(true);
    try {
      const res = await requestOtp(value);
      setOtpSent(true);
      setDevCode(res.code ?? null);
      notifications.show({
        title: 'Code sent',
        message: res.code
          ? `Your verification code is ${res.code} (dev mode).`
          : 'A 6-digit code has been sent to your phone.',
        color: 'green',
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    const value = phone.trim();
    if (!value) {
      setError('Enter your phone number.');
      return;
    }
    if (!otpCode.trim()) {
      setError('Enter the 6-digit code.');
      return;
    }
    clearError();
    setBusy(true);
    try {
      await verifyOtp(value, otpCode.trim());
      onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordLogin = async () => {
    const value = phone.trim();
    const digits = value.replace(/\D/g, '');
    const identifier = digits || value;
    if (!value) {
      setError('Enter your phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    clearError();
    setBusy(true);
    try {
      await login(identifier, password);
      onSuccess();
    } catch {
      // Not registered yet (or wrong password). Try to auto-register the phone
      // as a new website account — `register` signs in on success. The username
      // mirrors the OTP convention (`shopper_<digits>`) so a phone account that
      // already exists is detected instead of creating a duplicate.
      try {
        await register({ username: `shopper_${identifier}`, phone: identifier, password });
        onSuccess();
      } catch (regErr) {
        const regMessage = getApiErrorMessage(regErr);
        if (/already exists/i.test(regMessage)) {
          setError(
            'This phone is already registered — check your password or use the verification code.'
          );
          setMode('otp');
        } else {
          setError(regMessage || 'Could not sign in. Try the verification code instead.');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Sign in to continue"
      centered
      size="sm"
      data-testid="checkout-phone-login-modal"
    >
      <Stack gap="md">
        <TextInput
          label="Phone number"
          placeholder="080 0000 0000"
          leftSection={<Phone size={15} />}
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value.replace(/[^0-9+]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              mode === 'otp' ? void handleRequestOtp() : void handlePasswordLogin();
            }
          }}
          radius="xl"
          styles={{ input: { borderColor: line } }}
        />
        {error && (
          <Alert
            icon={<AlertCircle size={16} />}
            color="red"
            variant="light"
            radius="lg"
            onClose={clearError}
          >
            <Text size="xs">{error}</Text>
          </Alert>
        )}

        {mode === 'otp' ? (
          <>
            {!otpSent ? (
              <Stack gap="sm">
                <Text size="xs" c={muted}>
                  We&apos;ll text you a 6-digit code to sign in or create an account.
                </Text>
                <Button
                  radius="xl"
                  loading={busy}
                  onClick={handleRequestOtp}
                  rightSection={<KeyRound size={16} />}
                  styles={{ root: { background: green } }}
                  disabled={!phone.trim()}
                  data-testid="checkout-phone-login-send-otp"
                >
                  Send code
                </Button>
              </Stack>
            ) : (
              <Stack gap="sm">
                <Text fw={700} c={ink}>
                  Enter verification code
                </Text>
                <Text size="xs" c={muted}>
                  Code sent to {phone.trim()}. It expires in 10 minutes.
                </Text>
                <PinInput
                  length={6}
                  type="number"
                  oneTimeCode
                  value={otpCode}
                  onChange={setOtpCode}
                  size="md"
                  styles={{ input: { borderColor: line } }}
                />
                {devCode ? (
                  <Text size="xs" c={green} fw={700} mt="xs">
                    Dev code: {devCode}
                  </Text>
                ) : null}
                <Group justify="space-between" mt="sm">
                  <Button
                    radius="xl"
                    variant="outline"
                    color="gray"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setDevCode(null);
                      clearError();
                    }}
                    styles={buttonStyles}
                    style={{ borderColor: line, color: ink }}
                    data-testid="checkout-phone-login-change-number"
                  >
                    Change number
                  </Button>
                  <Button
                    radius="xl"
                    loading={busy}
                    onClick={handleVerifyOtp}
                    leftSection={<Lock size={16} />}
                    styles={{ root: { background: green } }}
                    disabled={!otpCode.trim()}
                    data-testid="checkout-phone-login-verify-otp"
                  >
                    Verify &amp; continue
                  </Button>
                </Group>
              </Stack>
            )}
            <Button
              radius="xl"
              variant="text"
              color="gray"
              size="xs"
              onClick={() => {
                setMode('password');
                clearError();
              }}
              style={{ color: muted, alignSelf: 'center' }}
              data-testid="checkout-phone-login-use-password"
            >
              Use password instead
            </Button>
          </>
        ) : (
          <>
            <Stack gap="sm">
              <Text fw={700} c={ink}>
                Password
              </Text>
              <Text size="xs" c={muted}>
                Sign in with your account password.
              </Text>
              <PasswordInput
                placeholder="Enter your password"
                leftSection={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                radius="xl"
                styles={{ input: { borderColor: line } }}
              />
              <Button
                radius="xl"
                loading={busy}
                onClick={handlePasswordLogin}
                leftSection={<Lock size={16} />}
                styles={{ root: { background: green } }}
                disabled={!phone.trim() || !password}
                data-testid="checkout-phone-login-signin"
              >
                Sign in
              </Button>
            </Stack>
            <Button
              radius="xl"
              variant="text"
              color="gray"
              size="xs"
              onClick={() => {
                setMode('otp');
                clearError();
              }}
              style={{ color: muted, alignSelf: 'center' }}
              data-testid="checkout-phone-login-use-otp"
            >
              Use verification code instead
            </Button>
          </>
        )}
      </Stack>
    </Modal>
  );
}
