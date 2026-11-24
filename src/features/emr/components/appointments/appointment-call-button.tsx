import { Video } from 'lucide-react';
import { CallButton } from '@/components/rtc/call-button';
import { usePatientByMrn } from '../../hooks/use-patient-by-mrn';

/**
 * Room id for a teleconsultation.
 *
 * The room IS the conversation the patient joined from chat, so the appointment
 * stores its `conversationId`. The phone-derived `appt-<digits>` id is only a
 * fallback for appointments booked before that link existed — using it for a
 * live consultation would put the clinician in a room the patient never joins.
 */
function callRoomId(
  conversationId: string | null | undefined,
  phone: string | null | undefined
): string | null {
  if (conversationId) return conversationId;
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length >= 7 ? `appt-${digits}` : null;
}

/**
 * Standalone call control for an appointment row: it opens no media until
 * clicked, then joins the room and shows the call overlay.
 */
export function AppointmentCallButton({
  patientMrn,
  conversationId,
  disabled,
}: {
  patientMrn?: string | null;
  /** Conversation the patient booked/joined from; the call room id. */
  conversationId?: string | null;
  disabled?: boolean;
}) {
  const { data: patient, isLoading } = usePatientByMrn(patientMrn);
  const callId = callRoomId(conversationId, patient?.phone);

  if (isLoading || !callId) {
    return null;
  }

  return (
    <CallButton
      callId={callId}
      label="Video call"
      leftSection={<Video size={14} />}
      size="compact-xs"
      variant="light"
      disabled={disabled}
    />
  );
}
