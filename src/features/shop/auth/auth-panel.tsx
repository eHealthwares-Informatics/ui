import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Input,
  PasswordInput,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from '@tanstack/react-router';
import {
  KeyRound,
  Lock,
  Mail,
  Phone,
  User,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../website/auth-store';
import { green, ink, muted, line, buttonStyles } from '../website/components';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

export type AuthTab = 'signin' | 'register';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.98 11.98 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function isPhoneIdentifier(value: string): boolean {
  const digits = value.replace(/[^0-9]/g, '');
  return digits.length >= 7 && digits.length / Math.max(value.length, 1) > 0.5;
}

interface AuthPanelProps {
  /** 'drawer' closes via onSuccess; 'page' routes to /shop. */
  variant: 'drawer' | 'page';
  initialTab?: AuthTab;
  onSuccess?: () => void;
}

/**
 * Shared sign-in / registration panel for the storefront. Sign-in accepts an
 * email or a phone number with either the account password or a one-time code
 * (password first, OTP as automatic fallback once a code has been sent).
 * Social sign-in covers Google and Facebook; tokens are verified server-side.
 */
export function AuthPanel({
  variant,
  initialTab = 'signin',
  onSuccess,
}: AuthPanelProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AuthTab>(initialTab);

  // ── Sign in ────────────────────────────────────────────────
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Register ───────────────────────────────────────────────
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const authLogin = useAuthStore((s) => s.login);
  const authRegister = useAuthStore((s) => s.register);
  const authRequestOtp = useAuthStore((s) => s.requestOtp);
  const authVerifyOtp = useAuthStore((s) => s.verifyOtp);
  const authGoogle = useAuthStore((s) => s.googleSignIn);
  const authFacebook = useAuthStore((s) => s.facebookSignIn);

  const finish = () => {
    if (variant === 'page') {
      navigate({ to: '/shop' });
    }
    onSuccess?.();
  };

  const handleSendOtp = async () => {
    if (!isPhoneIdentifier(identifier)) {
      notifications.show({
        message: 'Enter a phone number to receive a one-time code.',
        color: 'orange',
      });
      return;
    }
    setOtpSending(true);
    try {
      const res = await authRequestOtp(identifier);
      setOtpSent(true);
      setDevCode(res.code ?? null);
      notifications.show({
        title: 'Code sent',
        message: res.code
          ? `Your verification code is ${res.code} (dev mode).`
          : 'We sent a 6-digit code to your phone.',
        color: 'green',
      });
    } catch (error: unknown) {
      notifications.show({
        message: getApiErrorMessage(error),
        color: 'red',
      });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      notifications.show({ message: 'Enter the 6-digit code.', color: 'orange' });
      return;
    }
    setLoginLoading(true);
    try {
      await authVerifyOtp(identifier, otpCode.trim());
      finish();
    } catch (error: unknown) {
      notifications.show({
        message: getApiErrorMessage(error),
        color: 'red',
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!identifier) {
      notifications.show({ message: 'Enter your email or phone.', color: 'orange' });
      return;
    }

    // OTP path: a code was requested and no password is given.
    if (otpSent && !password) {
      await handleVerifyOtp();
      return;
    }

    setLoginLoading(true);
    try {
      await authLogin(identifier, password);
      finish();
    } catch {
      // OTP fallback: password auth failed but a code was sent → try it.
      if (otpSent && otpCode.trim()) {
        try {
          await authVerifyOtp(identifier, otpCode.trim());
          finish();
        } catch (error: unknown) {
          notifications.show({
            message: getApiErrorMessage(error),
            color: 'red',
          });
        }
      } else if (otpSent && !otpCode.trim()) {
        notifications.show({
          message: 'Password incorrect — enter the 6-digit code we sent you.',
          color: 'orange',
        });
      } else {
        notifications.show({
          message: 'Invalid credentials. Use Send OTP for phone sign-in.',
          color: 'red',
        });
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { googleLogin } = await import('@/lib/social-auth');
      const accessToken = await googleLogin();
      if (!accessToken) return;
      setLoginLoading(true);
      await authGoogle(accessToken);
      finish();
    } catch (error) {
      notifications.show({
        message: error instanceof Error ? error.message : 'Google sign-in failed.',
        color: 'red',
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFacebook = async () => {
    try {
      const { facebookLogin } = await import('@/lib/social-auth');
      const accessToken = await facebookLogin();
      if (!accessToken) return;
      setLoginLoading(true);
      await authFacebook(accessToken);
      finish();
    } catch (error) {
      notifications.show({
        message: error instanceof Error ? error.message : 'Facebook sign-in failed.',
        color: 'red',
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName || !regPassword || regPassword !== regConfirm) {
      notifications.show({
        message: 'Please fill all fields and ensure passwords match.',
        color: 'red',
      });
      return;
    }
    setRegLoading(true);
    try {
      await authRegister({
        username: regName,
        email: regEmail || undefined,
        phone: regPhone || undefined,
        password: regPassword,
      });
      finish();
    } catch (error: unknown) {
      notifications.show({
        message: getApiErrorMessage(error),
        color: 'red',
      });
    } finally {
      setRegLoading(false);
    }
  };

  const socialButtons =
    variant === 'drawer' ? (
      <Group grow>
        <Button
          radius="xl"
          variant="outline"
          color="gray"
          leftSection={<GoogleIcon />}
          styles={buttonStyles}
          onClick={handleGoogle}
          style={{ borderColor: line, color: ink }}
        >
          Google
        </Button>
        <Button
          radius="xl"
          variant="outline"
          color="gray"
          leftSection={<FacebookIcon />}
          styles={buttonStyles}
          onClick={handleFacebook}
          style={{ borderColor: line, color: ink }}
        >
          Facebook
        </Button>
      </Group>
    ) : (
      <Stack gap="sm">
        <Button
          radius="xl"
          variant="outline"
          color="gray"
          size="md"
          leftSection={<GoogleIcon />}
          onClick={handleGoogle}
          style={{ borderColor: line, color: ink }}
        >
          Continue with Google
        </Button>
        <Button
          radius="xl"
          variant="outline"
          color="gray"
          size="md"
          leftSection={<FacebookIcon />}
          onClick={handleFacebook}
          style={{ borderColor: line, color: ink }}
        >
          Continue with Facebook
        </Button>
      </Stack>
    );

  return (
    <Tabs value={tab} onChange={(value) => setTab((value as AuthTab) ?? 'signin')}>
      <Tabs.List grow mb="lg">
        <Tabs.Tab value="signin" fw={800} style={{ fontSize: 14 }}>
          Sign In
        </Tabs.Tab>
        <Tabs.Tab value="register" fw={800} style={{ fontSize: 14 }}>
          Register
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="signin">
        <Stack gap="md">
          <div>
            <Text size="sm" fw={800} mb={4}>
              Email or Phone
            </Text>
            <Box pos="relative">
              <Input
                placeholder="you@example.com or 08012345678"
                radius="xl"
                size="md"
                leftSection={<Mail size={18} />}
                value={identifier}
                onChange={(e) => setIdentifier(e.currentTarget.value)}
                styles={{ input: { borderColor: '#CFE5D7', paddingRight: 78 } }}
              />
              <Text
                size="xs"
                fw={800}
                c={green}
                style={{
                  cursor: 'pointer',
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                }}
                onClick={otpSending ? undefined : handleSendOtp}
                opacity={otpSending ? 0.5 : 1}
              >
                {otpSending ? 'Sending…' : 'Send OTP'}
              </Text>
            </Box>
          </div>

          {otpSent ? (
            <div>
              <Text size="sm" fw={800} mb={4}>
                Verification Code
              </Text>
              <Input
                placeholder="6-digit code"
                radius="xl"
                size="md"
                inputMode="numeric"
                maxLength={6}
                leftSection={<KeyRound size={18} />}
                value={otpCode}
                onChange={(e) => setOtpCode(e.currentTarget.value.replace(/[^0-9]/g, ''))}
                styles={{ input: { borderColor: '#CFE5D7', letterSpacing: 4 } }}
              />
              {devCode ? (
                <Text size="xs" c={muted} mt={4}>
                  Dev mode code: {devCode}
                </Text>
              ) : null}
            </div>
          ) : null}

          <div>
            <Text size="sm" fw={800} mb={4}>
              {otpSent ? 'Password or OTP' : 'Password'}
            </Text>
            <PasswordInput
              placeholder={otpSent ? 'Leave empty to sign in with the code' : 'Enter your password'}
              radius="xl"
              size="md"
              leftSection={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              styles={{ input: { borderColor: '#CFE5D7' } }}
            />
          </div>

          <Group justify="space-between">
            <Checkbox label="Remember me" color="green" size="xs" />
            <Text
              size="xs"
              fw={800}
              c={green}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate({ to: '/shop/forgot-password' })}
            >
              Forgot password?
            </Text>
          </Group>

          <Button
            radius="xl"
            size="md"
            fullWidth
            styles={buttonStyles}
            loading={loginLoading}
            style={{ background: green }}
            onClick={handleLogin}
          >
            Sign In
          </Button>

          <Divider label="or continue with" labelPosition="center" />

          {socialButtons}
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="register">
        <Stack gap="md">
          <div>
            <Text size="sm" fw={800} mb={4}>
              Full Name
            </Text>
            <Input
              placeholder="Your full name"
              radius="xl"
              size="md"
              leftSection={<User size={18} />}
              value={regName}
              onChange={(e) => setRegName(e.currentTarget.value)}
              styles={{ input: { borderColor: '#CFE5D7' } }}
            />
          </div>
          <div>
            <Text size="sm" fw={800} mb={4}>
              Email
            </Text>
            <Input
              placeholder="you@example.com"
              radius="xl"
              size="md"
              leftSection={<Mail size={18} />}
              value={regEmail}
              onChange={(e) => setRegEmail(e.currentTarget.value)}
              styles={{ input: { borderColor: '#CFE5D7' } }}
            />
          </div>
          <div>
            <Text size="sm" fw={800} mb={4}>
              Phone
            </Text>
            <Input
              placeholder="+234 801 234 5678"
              radius="xl"
              size="md"
              leftSection={<Phone size={18} />}
              value={regPhone}
              onChange={(e) => setRegPhone(e.currentTarget.value)}
              styles={{ input: { borderColor: '#CFE5D7' } }}
            />
          </div>
          <div>
            <Text size="sm" fw={800} mb={4}>
              Password
            </Text>
            <PasswordInput
              placeholder="Create a strong password"
              radius="xl"
              size="md"
              leftSection={<Lock size={18} />}
              value={regPassword}
              onChange={(e) => setRegPassword(e.currentTarget.value)}
              styles={{ input: { borderColor: '#CFE5D7' } }}
            />
          </div>
          <div>
            <Text size="sm" fw={800} mb={4}>
              Confirm Password
            </Text>
            <PasswordInput
              placeholder="Repeat your password"
              radius="xl"
              size="md"
              leftSection={<Lock size={18} />}
              value={regConfirm}
              onChange={(e) => setRegConfirm(e.currentTarget.value)}
              styles={{ input: { borderColor: '#CFE5D7' } }}
            />
          </div>
          <Button
            radius="xl"
            size="md"
            fullWidth
            leftSection={<UserPlus size={18} />}
            styles={buttonStyles}
            loading={regLoading}
            style={{ background: green }}
            onClick={handleRegister}
          >
            Create Account
          </Button>
        </Stack>
      </Tabs.Panel>
    </Tabs>
  );
}
