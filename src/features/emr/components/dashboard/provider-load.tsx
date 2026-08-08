import { Avatar, Badge, Card, Group, Stack, Text } from '@mantine/core';
import type { ProviderLoadEntry } from '../../lib/emr-types';

const AVATAR_COLORS = ['blue', 'teal', 'orange', 'grape', 'cyan', 'lime', 'pink'];

export function ProviderLoad({ providers }: { providers: ProviderLoadEntry[] }) {
  return (
    <Card withBorder radius="md" padding="lg" shadow="sm">
      <Text size="sm" fw={600} mb="md">
        Provider Workload
      </Text>
      {providers.length === 0 ? (
        <Text size="sm" c="dimmed">
          No providers on duty right now.
        </Text>
      ) : (
        <Stack gap="sm">
          {providers.map((provider, index) => (
            <Group key={provider.providerId || index} justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                <Avatar
                  size="sm"
                  radius="xl"
                  color={AVATAR_COLORS[index % AVATAR_COLORS.length]}
                >
                  {provider.providerName
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </Avatar>
                <Text size="sm" fw={500} truncate>
                  {provider.providerName}
                </Text>
              </Group>
              <Badge
                size="sm"
                variant={provider.patientCount > 3 ? 'filled' : 'light'}
                color={provider.patientCount > 3 ? 'red' : 'blue'}
                radius="sm"
              >
                {provider.patientCount} patients
              </Badge>
            </Group>
          ))}
        </Stack>
      )}
    </Card>
  );
}
