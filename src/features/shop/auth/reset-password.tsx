import { Button, Container, Input, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { Lock, Check } from 'lucide-react';
import { useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { websiteApi } from '../website/api';
import { WebsiteLayout, green, ink, muted, line, buttonStyles } from '../website/layout';

export default function ResetPasswordPage({ token }: { token: string }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;

  async function handleSubmit() {
    if (!token) {
      setError('This reset link is missing its token. Request a new link.');
      return;
    }
    if (password.length < 8 || password !== confirm) return;
    setSubmitting(true);
    setError(null);
    try {
      await websiteApi.resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Could not reset your password');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <WebsiteLayout>
        <Container size="sm" py={80}>
          <Paper radius={30} p="xl" withBorder style={{ borderColor: line, textAlign: 'center' }}>
            <ThemeIcon radius="xl" size={64} color="green" mx="auto">
              <Check size={32} />
            </ThemeIcon>
            <Title order={2} className="damorex-heading" mt="md">
              Password Updated
            </Title>
            <Text c={muted} lh={1.7} mt="sm">
              Your password has been reset. You can now sign in with your new password.
            </Text>
            <Button
              radius="xl"
              mt="lg"
              styles={buttonStyles}
              style={{ background: green }}
              onClick={() => navigate({ to: '/shop/login' })}
            >
              Back to Sign In
            </Button>
          </Paper>
        </Container>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <Container size="sm" py={80}>
        <Paper radius={30} p="xl" withBorder style={{ borderColor: line }}>
          <Stack gap="lg">
            <Title order={2} className="damorex-heading">
              Choose a New Password
            </Title>
            <Text c={muted} lh={1.7}>
              Enter a new password for your account.
            </Text>

            <Input.Wrapper
              label="New password"
              error={tooShort ? 'At least 8 characters' : undefined}
            >
              <Input
                type="password"
                placeholder="New password"
                radius="xl"
                size="md"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                leftSection={<Lock size={18} />}
                styles={{ input: { borderColor: '#CFE5D7' } }}
              />
            </Input.Wrapper>

            <Input.Wrapper
              label="Confirm password"
              error={mismatch ? 'Passwords do not match' : undefined}
            >
              <Input
                type="password"
                placeholder="Repeat password"
                radius="xl"
                size="md"
                value={confirm}
                onChange={(e) => setConfirm(e.currentTarget.value)}
                leftSection={<Lock size={18} />}
                styles={{ input: { borderColor: '#CFE5D7' } }}
              />
            </Input.Wrapper>

            {error ? (
              <Text c="red" size="sm">
                {error}
              </Text>
            ) : null}

            <Button
              radius="xl"
              size="lg"
              fullWidth
              styles={buttonStyles}
              style={{ background: green }}
              onClick={handleSubmit}
              loading={submitting}
              disabled={password.length < 8 || password !== confirm}
            >
              Reset Password
            </Button>
          </Stack>
        </Paper>
      </Container>
    </WebsiteLayout>
  );
}
