import { Card, Text, Title, Stack, Anchor, Group } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { AuthLayout } from '../../auth-layout';
import { SignUpForm } from '../components/sign-up-form';

export function SignUp() {
  return (
    <AuthLayout>
      <Card withBorder shadow="sm" radius="md" padding="lg">
        <Stack gap="md">
          {/* ===== Header ===== */}
          <div>
            <Title order={4}>Create an account</Title>

            <Text size="sm" c="dimmed" mt={4}>
              Enter your email and password to create an account. <br />
              Already have an account?{' '}
              <Anchor component={Link} to="/sign-in">
                Sign In
              </Anchor>
            </Text>
          </div>

          {/* ===== Form ===== */}
          <SignUpForm />

          {/* ===== Footer ===== */}
          <Text size="xs" c="dimmed" ta="center">
            By creating an account, you agree to our <Anchor href="/terms">Terms of Service</Anchor>{' '}
            and <Anchor href="/privacy">Privacy Policy</Anchor>.
          </Text>
        </Stack>
      </Card>
    </AuthLayout>
  );
}
