import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  TextInput,
  Badge,
  Alert,
  Box,
} from '@mantine/core';
import { Shield } from 'lucide-react';

export function TwoFactorSection() {
  return (
    <Card withBorder radius="md" p="lg" data-testid="account-two-factor">
      <Stack gap="md">
        <Group align="center" gap="xs" wrap="nowrap">
          <Shield size={16} strokeWidth={1.5} />
          <Title order={3}>Two-factor authentication</Title>
          <Badge size="xs" variant="filled" color="gray">Disabled</Badge>
        </Group>

        <Alert title="Heads up" icon={<Shield size={16} strokeWidth={1.5} />} color="blue" mb="md">
          Enabling two factor authentication is recommended and irreversible. Having two factor
          authentication enabled will require you to enter a code from your authenticator app every
          time you sign in. This is essential for keeping your account secure.
        </Alert>

        <Group align="start" gap="md" wrap="wrap">
          <Box
            component="img"
            src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=otpauth://totp/Account:johnhealthwares@gmail.com?secret=JBSWY3DPEHPK3PXP"
            alt="Two-factor authentication QR code"
            style={{
              width: 160,
              height: 160,
              border: '1px solid var(--mantine-color-gray-3)',
              borderRadius: 6,
              background: '#fff',
            }}
          />
          <Stack gap="xs" style={{ minWidth: 0, flex: 1 }}>
            <Text fw={600} size="sm">Scan this code</Text>
            <Text size="xs" c="dimmed">
              Scan this code with your authenticator app to enable two-factor authentication.
            </Text>
          </Stack>
        </Group>

        <Stack gap="xs">
          <Text fw={600} size="sm">Code</Text>
          <Text size="xs" c="dimmed">Enter the code from your authenticator app.</Text>
          <TextInput placeholder="Enter code" style={{ height: 36 }} />
        </Stack>
      </Stack>
    </Card>
  );
}
