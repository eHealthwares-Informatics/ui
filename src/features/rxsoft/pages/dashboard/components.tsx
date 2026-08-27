import { Badge, Box, Card, Center, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatDelta } from './format';

export function KpiCard({
  label,
  value,
  subtitle,
  delta,
  icon: Icon,
  color,
  deltaColor,
}: {
  label: string;
  value: string;
  subtitle?: string;
  delta?: number;
  icon: React.ComponentType<{
    size?: number | string;
    strokeWidth?: number | string;
    className?: string;
  }>;
  color: string;
  deltaColor: string;
}) {
  const isDown = delta !== undefined && delta < 0;
  return (
    <Card withBorder radius="md" p="md">
      <Group gap="sm" align="flex-start" wrap="nowrap">
        <ThemeIcon color={color} variant="light" size="md" radius="md">
          <Icon size={20} strokeWidth={2} />
        </ThemeIcon>
        <Stack gap={2} style={{ flex: 1 }}>
          <Text size="xs" c="dimmed" fw={600}>
            {label}
          </Text>
          <Text size="xl" fw={700} lh={1.1} lineClamp={1} title={value}>
            {value}
          </Text>
          {subtitle && (
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          )}
        </Stack>
      </Group>

      <Group gap={4} mt="sm" align="center" wrap="nowrap">
        {delta !== undefined ? (
          <Badge
            size="xs"
            variant="light"
            color={deltaColor}
            styles={{ root: { textTransform: 'none' } }}
          >
            <Group gap={2} wrap="nowrap">
              {isDown ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
              {formatDelta(delta)}
            </Group>
          </Badge>
        ) : (
          <Badge size="xs" variant="light" color="gray">
            —
          </Badge>
        )}
        <Text size="xs" c="dimmed">
          vs previous period
        </Text>
      </Group>
    </Card>
  );
}

export function ChartCard({
  title,
  action,
  children,
  h,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  h?: number;
}) {
  return (
    <Paper withBorder radius="md" p="md" style={{ height: '100%' }}>
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text fw={600} size="sm">
            {title}
          </Text>
          {action}
        </Group>
        <Box style={{ flex: 1, minHeight: h ?? 300 }}>{children}</Box>
      </Stack>
    </Paper>
  );
}

export function EmptyChart({ h = 260 }: { h?: number }) {
  return (
    <Center h={h}>
      <Text size="sm" c="dimmed">
        No data for the selected period
      </Text>
    </Center>
  );
}
