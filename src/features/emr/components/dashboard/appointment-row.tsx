import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import { CalendarClock, MapPin, UserRound } from 'lucide-react';
import type { Appointment } from '../../lib/emr-types';
import { appointmentAction, appointmentStyle } from './appointment-status';

export function AppointmentRow({
  appointment,
  onAction,
}: {
  appointment: Appointment;
  onAction?: (appointment: Appointment) => void;
}) {
  const style = appointmentStyle(appointment);
  const action = appointmentAction(appointment);

  return (
    <Card
      withBorder
      radius="md"
      padding="md"
      style={{ borderLeft: `4px solid ${style.borderColor}`, backgroundColor: style.cardTint }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Stack gap={2} style={{ minWidth: 56 }}>
            <Text fw={700} size="md" lh={1.1}>
              {appointment.startTime}
            </Text>
            <Text size="xs" c="dimmed">
              {appointment.endTime ?? ''}
            </Text>
          </Stack>

          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
            <Group gap="xs" wrap="nowrap">
              <Text fw={600} truncate>
                {appointment.patientName}
              </Text>
              <Badge size="sm" color={style.color} variant="light" radius="sm">
                {style.label}
              </Badge>
            </Group>
            <Group gap="md" wrap="wrap">
              <Group gap={4}>
                <UserRound size={13} color="gray" />
                <Text size="xs" c="dimmed">
                  {appointment.providerName ?? 'Unassigned'}
                </Text>
              </Group>
              <Group gap={4}>
                <MapPin size={13} color="gray" />
                <Text size="xs" c="dimmed">
                  {appointment.locationId ?? 'Room —'}
                </Text>
              </Group>
              <Group gap={4}>
                <CalendarClock size={13} color="gray" />
                <Text size="xs" c="dimmed">
                  {appointment.appointmentType.replace('_', ' ').toLowerCase()}
                </Text>
              </Group>
            </Group>
          </Stack>
        </Group>

        {action && (
          <Button
            variant={action.variant}
            color={action.color}
            size="xs"
            radius="md"
            onClick={() => onAction?.(appointment)}
          >
            {action.label}
          </Button>
        )}
      </Group>
    </Card>
  );
}
