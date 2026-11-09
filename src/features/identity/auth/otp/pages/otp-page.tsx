import { Paper, Stack, Title, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { AuthLayout } from '../../auth-layout';
import { OtpForm } from '../components/otp-form';

export function Otp() {
  return (
    <AuthLayout>
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          {/* Header */}
          <div>
            <Title order={4}>Two-factor Authentication</Title>

            <Text size="sm" c="dimmed" mt="xs">
              Please enter the authentication code. <br />
              We have sent the authentication code to your email.
            </Text>
          </div>

          {/* Content */}
          <OtpForm />

          {/* Footer */}
          <Text size="sm" ta="center" c="dimmed">
            Haven&apos;t received it?{' '}
            <Link to="/sign-in" className="underline underline-offset-4 hover:text-primary">
              Resend a new code
            </Link>
            .
          </Text>
        </Stack>
      </Paper>
    </AuthLayout>
  );
}
