import { Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { type LucideIcon } from 'lucide-react';
import {
  DashboardCard,
  dashboardMetricClasses,
  type DashboardTone,
} from '@/features/components/dashboard/dashboard-surface';

export function MetricCard({
  icon: Icon,
  tone,
  label,
  value,
  subtitle,
}: {
  icon: LucideIcon;
  /** Mantine palette colour; tints the card, icon tile and metric type. */
  tone: DashboardTone;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <DashboardCard tone={tone} padding="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={2}>
          <span className={dashboardMetricClasses.label}>
            {label}
          </span>
          <span className={dashboardMetricClasses.value}>
            {value}
          </span>
          {subtitle && (
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          )}
        </Stack>
        <ThemeIcon radius="md" size={40} variant="light" color={tone}>
          <Icon size={20} strokeWidth={2} />
        </ThemeIcon>
      </Group>
    </DashboardCard>
  );
}
