import { Box, Button, Container, Input, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import { useState } from 'react';
import { WebsiteLayout, green, ink, muted, line, buttonStyles } from '../website/layout';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <WebsiteLayout>
        <Container size="sm" py={80}>
          <Paper radius={30} p="xl" withBorder style={{ borderColor: line, textAlign: 'center' }}>
            <ThemeIcon radius="xl" size={64} color="green" mx="auto">
              <Check size={32} />
            </ThemeIcon>
            <Title order={2} className="damorex-heading" mt="md">
              Check Your Email
            </Title>
            <Text c={muted} lh={1.7} mt="sm">
              If an account exists for {email}, you&apos;ll receive a reset link.
            </Text>
            <Button
              radius="xl"
              mt="lg"
              variant="light"
              color="green"
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
            <Button
              variant="subtle"
              color="gray"
              leftSection={<ArrowLeft size={18} />}
              onClick={() => navigate({ to: '/shop/login' })}
              styles={buttonStyles}
            >
              Back
            </Button>
            <Title order={2} className="damorex-heading">
              Reset Password
            </Title>
            <Text c={muted} lh={1.7}>
              Enter your email address and we&apos;ll send a reset link.
            </Text>

            <Input.Wrapper label="Email">
              <Input
                placeholder="you@example.com"
                radius="xl"
                size="md"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                leftSection={<Mail size={18} />}
                styles={{ input: { borderColor: '#CFE5D7' } }}
              />
            </Input.Wrapper>

            <Button
              radius="xl"
              size="lg"
              fullWidth
              styles={buttonStyles}
              style={{ background: green }}
              onClick={() => setSent(true)}
              disabled={!email}
            >
              Send Reset Link
            </Button>
          </Stack>
        </Paper>
      </Container>
    </WebsiteLayout>
  );
}
