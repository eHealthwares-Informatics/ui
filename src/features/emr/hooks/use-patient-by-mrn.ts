import { useQuery } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';
import type { PatientDetail } from '../lib/emr-types';

/** Resolve a patient MRN to the full patient record (including the UUID id). */
export function usePatientByMrn(mrn: string | null | undefined) {
  return useQuery({
    queryKey: ['emr', 'patients', 'by-mrn', mrn],
    queryFn: async () => {
      const { data } = await emrApi.get<PatientDetail>(
        `/patients/by-mrn/${encodeURIComponent(String(mrn))}`,
      );
      return data;
    },
    enabled: Boolean(mrn),
    retry: false,
  });
}
