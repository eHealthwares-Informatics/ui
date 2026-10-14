import {
  Button,
  Center,
  Container,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from '@tanstack/react-router';
import { Check, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { websiteApi } from '../website/api';
import { WebsiteLayout, green, ink, muted, line, buttonStyles } from '../website/layout';

type State = 'verifying' | 'verified' | 'error';

export default function VerifyEmailPage({
  token,
  email: initialEmail = '',
}: {
  token: string;
  email?: string;
}) {
  const navigate = useNavigate();
  const [state, setState] = useState<State>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) {
      setState('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    websiteApi
      .verifyEmail({ token })
      .then(() => active && setState('verified'))
      .catch((err) => {
        if (!active) return;
        setState('error');
        setMessage(getApiErrorMessage(err) || 'Could not verify your email.');
      });
    return () => {
      active = false;
    };
  }, [token]);

  // A verification link that has expired or already been consumed leaves the
  // user with no way forward — without this they can only leave the page.
  const handleResend = async () => {
    const target = email.trim();
    if (!target) {
      notifications.show({ message: 'Enter your email address to resend.', color: 'orange' });
      return;
    }

    setResending(true);
    try {
      const result = await websiteApi.requestEmailVerification({ email: target });
      notifications.show(
        result.alreadyVerified
          ? {
              title: 'Already verified',
              message: 'That address is already confirmed — you can just sign in.',
              color: 'blue',
            }
          : {
              title: 'Email sent',
              message: `We sent a new verification link to ${target}.`,
              color: 'green',
            }
      );
    } catch (error: unknown) {
      notifications.show({
        message: getApiErrorMessage(error) || 'Could not resend the verification email.',
        color: 'red',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <WebsiteLayout>
      <Container size="sm" py={80}>
        <Paper radius={30} p="xl" withBorder style={{ borderColor: line, textAlign: 'center' }}>
          {state === 'verifying' ? (
            <>
              <Center>
                <Loader color="green" />
              </Center>
              <Title order={3} className="damorex-heading" mt="md">
                Verifying your email…
              </Title>
            </>
          ) : (
            <>
              <ThemeIcon
                radius="xl"
                size={64}
                color={state === 'verified' ? 'green' : 'red'}
                mx="auto"
              >
                {state === 'verified' ? <Check size={32} /> : <AlertCircle size={32} />}
              </ThemeIcon>
              <Title order={2} className="damorex-heading" mt="md">
                {state === 'verified' ? 'Email Verified' : 'Verification Failed'}
              </Title>
              <Text c={muted} lh={1.7} mt="sm">
                {state === 'verified' ? 'Thanks! Your email address is now confirmed.' : message}
              </Text>

              {state === 'error' && (
                <Stack gap="sm" mt="lg" align="stretch" style={{ textAlign: 'left' }}>
                  <TextInput
                    label="Email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    radius="md"
                    data-testid="resend-email"
                  />
                  <Button
                    radius="xl"
                    styles={buttonStyles}
                    variant="light"
                    color="green"
                    loading={resending}
                    onClick={handleResend}
                    data-testid="resend-verification"
                  >
                    Resend verification email
                  </Button>
                </Stack>
              )}

              <Button
                radius="xl"
                mt="lg"
                styles={buttonStyles}
                style={{ background: green }}
                onClick={() => navigate({ to: '/shop' })}
              >
                Continue Shopping
              </Button>
            </>
          )}
        </Paper>
      </Container>
    </WebsiteLayout>
  );
}
