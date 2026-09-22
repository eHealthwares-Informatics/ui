import { ActionIcon, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Printer } from 'lucide-react';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';

export function PrintAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Tooltip label="Print appointment slip (PDF)">
      <ActionIcon
        variant="light"
        color="teal"
        loading={loading}
        aria-label="Print appointment"
        onClick={async () => {
          setLoading(true);
          try {
            const res = await emrApi.get<Blob>(`/appointments/${appointmentId}/pdf`, {
              responseType: 'blob',
            });
            const pdf = new Blob([res.data as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(pdf);
            const win = window.open(url, '_blank');
            if (win) {
              win.onload = () => win.print();
            }
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
          } catch {
            notifications.show({ color: 'red', message: 'Failed to generate appointment PDF.' });
          } finally {
            setLoading(false);
          }
        }}
      >
        <Printer size={16} />
      </ActionIcon>
    </Tooltip>
  );
}
