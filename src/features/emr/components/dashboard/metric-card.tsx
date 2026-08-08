import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { type LucideIcon } from 'lucide-react';

export function MetricCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  subtitle,
}: {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card withBorder radius="md" padding="lg" shadow="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={2}>
          <Text size="xs" tt="uppercase" fw={600} c="dimmed" lts={1.1}>
            {label}
          </Text>
          <Text size="xl" fw={700} lh={1.2}>
            {value}
          </Text>
          {subtitle && (
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          )}
        </Stack>
        <ThemeIcon radius="md" size={40} variant="light" color={iconBg} c={iconColor}>
          <Icon size={20} strokeWidth={2} />
        </ThemeIcon>
      </Group>
    </Card>
  );
}
