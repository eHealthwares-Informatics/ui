import { Alert, Group, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core';
import { CalendarCheck, CheckCircle2, Clock4, Stethoscope, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { RxPage } from '@/features/components/page/rx-page';
import { useDashboardSummary } from '../hooks/use-emr-dashboard';
import { MetricCard } from '../components/dashboard/metric-card';
import { AppointmentRow } from '../components/dashboard/appointment-row';
import { ProviderLoad } from '../components/dashboard/provider-load';
import { UpcomingList } from '../components/dashboard/upcoming-list';

function greetingForHour(hour: number): string {
  if (hour < 12) { return 'Good morning'; }
  if (hour < 17) { return 'Good afternoon'; }
  return 'Good evening';
}

export function EmrDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useDashboardSummary();

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [],
  );

  const handleAction = () => {
    void navigate({ to: '/emr/appointments' });
  };

  return (
    <RxPage
      breadcrumbs={[{ label: 'EMR' }, { label: 'Dashboard' }]}
      title=""
    >
      {/* GREETING */}
      <Stack gap={4} mb="lg">
        <Title order={2}>{greeting}</Title>
        <Text size="sm" c="dimmed">
          {formattedDate}
        </Text>
      </Stack>

      {isLoading && (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={110} radius="md" />
            ))}
          </SimpleGrid>
          <Skeleton height={260} radius="md" />
        </Stack>
      )}

      {isError && (
        <Alert color="red" icon={<AlertCircle size={16} />} title="Unable to load dashboard">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </Alert>
      )}

      {data && !isError && (
        <Stack gap="lg">
          {/* SUMMARY METRICS */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            <MetricCard
              icon={CalendarCheck}
              iconColor="#228be6"
              iconBg="blue"
              label="Today's Appointments"
              value={data.metrics.totalAppointments}
              subtitle={`${data.metrics.scheduled} still scheduled`}
            />
            <MetricCard
              icon={CheckCircle2}
              iconColor="#12b886"
              iconBg="teal"
              label="Checked In"
              value={data.metrics.checkedIn}
              subtitle={`${data.metrics.completed} completed`}
            />
            <MetricCard
              icon={Stethoscope}
              iconColor="#fd7e14"
              iconBg="orange"
              label="Providers on Duty"
              value={data.metrics.providersOnDuty}
              subtitle={`${data.metrics.inProgress} visits in progress`}
            />
            <MetricCard
              icon={Clock4}
              iconColor="#7048e8"
              iconBg="grape"
              label="Average Wait Time"
              value={data.metrics.averageWaitMinutes > 0 ? `${data.metrics.averageWaitMinutes}m` : '—'}
              subtitle={data.metrics.averageWaitMinutes > 0 ? 'from scheduled start' : 'No check-ins yet'}
            />
          </SimpleGrid>

          {/* MAIN WORKSPACE */}
          <SimpleGrid cols={{ base: 1, lg: 7 }} spacing="lg">
            <Stack gap="sm" style={{ gridColumn: 'span 4' }}>
              <Group justify="space-between">
                <Title order={4}>Today's Appointments</Title>
                <Text size="xs" c="dimmed">
                  {data.appointments.length} for {data.date}
                </Text>
              </Group>
              {data.appointments.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No appointments scheduled for today.
                </Text>
              ) : (
                data.appointments.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    onAction={handleAction}
                  />
                ))
              )}
            </Stack>

            <Stack gap="md" style={{ gridColumn: 'span 3' }}>
              <ProviderLoad providers={data.providerLoad} />
              <UpcomingList appointments={data.upcoming} />
            </Stack>
          </SimpleGrid>
        </Stack>
      )}
    </RxPage>
  );
}
