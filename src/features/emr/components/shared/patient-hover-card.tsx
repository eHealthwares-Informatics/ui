import { Avatar, Badge, Group, HoverCard, Skeleton, Stack, Text } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { usePatientByMrn } from '../../hooks/use-patient-by-mrn';
import type { PatientDetail } from '../../lib/emr-types';

function initialsOf(patient: PatientDetail | undefined): string {
  if (!patient) {
    return '—';
  }
  return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
}

function ageFrom(dateOfBirth: string | null): string {
  if (!dateOfBirth) {
    return '';
  }
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return '';
  }
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return `${age} yrs`;
}

function Labelled({ label, value }: { label: string; value?: ReactNode }) {
  if (!value) {
    return null;
  }
  return (
    <Stack gap={0}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </Stack>
  );
}

/** Patient name/MRN cell that pops up a summary card on hover. */
export function PatientHoverCard({
  mrn,
  label,
}: {
  mrn?: string | null;
  label?: ReactNode;
}) {
  const navigate = useNavigate();
  const { data: patient, isLoading, isError } = usePatientByMrn(mrn);

  const name = patient
    ? [patient.firstName, patient.lastName].filter(Boolean).join(' ')
    : null;

  if (isLoading) {
    return <Skeleton height={16} width={140} />;
  }

  if (isError || !patient) {
    return (
      <Text size="sm" fw={500}>
        {label ?? mrn ?? '—'}
      </Text>
    );
  }

  const trigger = label ?? (name || mrn || '—');

  return (
    <HoverCard withinPortal shadow="md" width={300} openDelay={150} closeDelay={100}>
      <HoverCard.Target>
        <Text
          size="sm"
          fw={500}
          style={{ cursor: 'pointer', width: 'fit-content' }}
          onClick={(e) => {
            e.stopPropagation();
            if (patient.id) {
              void navigate({ to: `/emr/patients/${patient.id}` });
            }
          }}
        >
          {trigger}
        </Text>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Stack gap="sm">
          <Group gap="sm" wrap="nowrap">
            <Avatar size={44} radius="xl" color="blue">
              {initialsOf(patient)}
            </Avatar>
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Text size="sm" fw={600} truncate>
                {name}
              </Text>
              <Group gap={6}>
                <Badge size="xs" variant="light">
                  {patient.patientId}
                </Badge>
                {patient.gender && (
                  <Badge size="xs" variant="dot" color="blue">
                    {patient.gender.toUpperCase()}
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>

          {patient.dateOfBirth && (
            <Text size="xs" c="dimmed">
              {ageFrom(patient.dateOfBirth)} · {patient.dateOfBirth}
            </Text>
          )}

          <Labelled label="Phone" value={patient.phone} />
          <Labelled label="Email" value={patient.email} />
          <Labelled label="Address" value={patient.address} />
          <Labelled
            label="Next of kin"
            value={
              patient.nextOfKinRelationship
                ? `${patient.nextOfKinName} (${patient.nextOfKinRelationship})`
                : patient.nextOfKinName
            }
          />
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}