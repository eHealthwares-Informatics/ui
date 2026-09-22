import { Box, Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle2 } from 'lucide-react';
import { AuthPanel } from './auth-panel';
import { green, ink, muted, line } from '../website/components';
import { WebsiteLayout } from '../website/layout';

const PERKS = [
  'Faster checkout with saved delivery details',
  'Upload prescriptions and track refills',
  'Earn reward points on every order',
];

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <WebsiteLayout>
      <Container size="xs" py={{ base: 28, md: 48 }}>
        <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
          <Stack gap="lg">
            <Box ta="center">
              <Title order={2} className="damorex-heading" c={ink}>
                Welcome to Damorex
              </Title>
              <Text c={muted} size="sm">
                Sign in with your email, phone or a social account.
              </Text>
            </Box>

            <AuthPanel variant="page" initialTab="signin" />
          </Stack>
        </Paper>

        <Paper radius={24} p="lg" withBorder mt="md" style={{ borderColor: line }}>
          <Stack gap="sm">
            <Text fw={900} c={ink}>
              Why create an account?
            </Text>
            {PERKS.map((perk) => (
              <Group key={perk} gap="sm" align="flex-start">
                <CheckCircle2 size={18} color={green} style={{ marginTop: 2, flexShrink: 0 }} />
                <Text size="sm" c={muted}>
                  {perk}
                </Text>
              </Group>
            ))}
            <Button
              variant="subtle"
              color="green"
              radius="xl"
              onClick={() => navigate({ to: '/shop' })}
              style={{ alignSelf: 'flex-start' }}
            >
              Browse medicines
            </Button>
          </Stack>
        </Paper>
      </Container>
    </WebsiteLayout>
  );
}
