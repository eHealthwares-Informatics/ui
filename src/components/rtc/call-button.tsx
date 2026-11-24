import { Button, type ButtonProps } from '@mantine/core';
import { Video } from 'lucide-react';
import { CALL_CONTROL_TYPE, type ChatControl } from '@/lib/rtc/call-client';
import { useCall } from '@/lib/rtc/use-call';
import { CallOverlay } from './call-overlay';

export type CallButtonProps = Omit<ButtonProps, 'onClick' | 'children'> & {
  /**
   * Room to join — the conversation id. The engine sets exactly this on the
   * `call.connect` control (`callId = conversation.id`), so both participants
   * land in the same room and the conversation's projections line up with it.
   */
  callId: string;
  label?: string;
  /** Voice-only consultation (e.g. an AUDIO appointment). */
  audioOnly?: boolean;
  /** Guest identity for the call socket; omit when the user is signed in. */
  phone?: string;
  guest?: boolean;
};

/**
 * Standalone call button. Drop it on any screen — it opens no media until the
 * user clicks, then joins the room and shows the video overlay.
 */
export function CallButton({
  callId,
  label = 'Connect call',
  audioOnly,
  phone,
  guest,
  ...buttonProps
}: CallButtonProps) {
  const call = useCall({ phone, guest });
  const inThisCall = call.callId === callId && call.status !== 'idle';

  return (
    <>
      <Button
        leftSection={<Video size={16} />}
        data-testid="rtc-call-button"
        {...buttonProps}
        onClick={() => call.start(callId, { audioOnly })}
      >
        {call.active && call.callId === callId ? 'In call — open' : label}
      </Button>
      <CallOverlay
        opened={inThisCall}
        status={call.status}
        error={call.error}
        peerPresent={call.peerPresent}
        muted={call.muted}
        cameraOff={call.cameraOff}
        audioOnly={call.audioOnly}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        joinedAt={call.joinedAt}
        peerJoinedAt={call.peerJoinedAt}
        onClose={call.reset}
        onHangUp={call.leave}
        onToggleMute={call.toggleMute}
        onToggleCamera={call.toggleCamera}
      />
    </>
  );
}

/**
 * The chat control: an actionable message (`call.connect`) rendered as a
 * button. Like a date picker's field, tapping it performs the action — the
 * patient never has to answer the message.
 */
export function CallControlButton({
  control,
  phone,
  guest,
}: {
  control?: ChatControl | null;
  phone?: string;
  guest?: boolean;
}) {
  if (!control || control.type !== CALL_CONTROL_TYPE || !control.callId) {
    return null;
  }
  return (
    <CallButton
      callId={control.callId}
      phone={phone}
      guest={guest}
      size="xs"
      radius="xl"
      variant="light"
      mt={8}
    />
  );
}
