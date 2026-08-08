import { Card, Group, Stack, Text } from '@mantine/core';
import type { Appointment } from '../../lib/emr-types';
import { appointmentStyle } from './appointment-status';

export function UpcomingList({ appointments }: { appointments: Appointment[] }) {
  return (
    <Card withBorder radius="md" padding="lg" shadow="sm">
      <Text size="sm" fw={600} mb="md">
        Upcoming Appointments
      </Text>
      {appointments.length === 0 ? (
        <Text size="sm" c="dimmed">
          No upcoming appointments.
        </Text>
      ) : (
        <Stack gap="sm">
          {appointments.map((appointment) => {
            const style = appointmentStyle(appointment);
            return (
              <Group key={appointment.id} gap="sm" wrap="nowrap" align="center">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: style.dotColor,
                    flexShrink: 0,
                  }}
                />
                <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={500} truncate>
                    {appointment.patientName}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {appointment.providerName ?? 'Unassigned'}
                  </Text>
                </Stack>
                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {appointment.date === new Date().toISOString().slice(0, 10)
                    ? appointment.startTime
                    : `${appointment.date.slice(5)} · ${appointment.startTime}`}
                </Text>
              </Group>
            );
          })}
        </Stack>
      )}
    </Card>
  );
}
