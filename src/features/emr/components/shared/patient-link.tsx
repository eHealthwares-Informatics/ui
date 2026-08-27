import { Anchor, Skeleton } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { usePatientByMrn } from '../../hooks/use-patient-by-mrn';

/** Link to the patient profile, resolving the MRN to the patient UUID. */
export function PatientLink({
  mrn,
  label,
}: {
  mrn: string;
  label?: string;
}) {
  const navigate = useNavigate();
  const { data: patient, isLoading, isError } = usePatientByMrn(mrn);

  if (isLoading) {
    return <Skeleton height={14} width={120} />;
  }

  if (isError || !patient) {
    return <>{label ?? mrn}</>;
  }

  const text = label ?? ([patient.firstName, patient.lastName].filter(Boolean).join(' ') || mrn);

  return (
    <Anchor
      component="button"
      type="button"
      size="sm"
      fw={500}
      onClick={() => void navigate({ to: `/emr/patients/${patient.id}` })}
    >
      {text}
    </Anchor>
  );
}
