import { ActionIcon, Box, Button, Group, Modal, Stack, Text, Tooltip } from '@mantine/core';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef, type CSSProperties } from 'react';
import type { CallStatus } from '@/lib/rtc/call-client';

type VideoTileProps = {
  stream: MediaStream | null;
  muted: boolean;
  style?: CSSProperties;
};

function VideoTile({ stream, muted, style }: VideoTileProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.srcObject = stream;
    if (stream) void element.play().catch(() => undefined);
    return () => {
      element.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
    />
  );
}

function statusLabel(status: CallStatus, peerPresent: boolean, audioOnly: boolean): string {
  switch (status) {
    case 'connecting':
      return audioOnly ? 'Opening microphone…' : 'Opening camera and microphone…';
    case 'waiting':
      return 'Waiting for the other participant to join…';
    case 'connecting-peer':
      return 'Connecting to the other participant…';
    case 'connected':
      return peerPresent ? 'Connected' : 'In call';
    case 'reconnecting':
      return 'Reconnecting…';
    case 'ended':
      return 'Call ended';
    case 'error':
      return 'Call failed';
    default:
      return '';
  }
}

export type CallStageProps = {
  status: CallStatus;
  error: string | null;
  peerPresent: boolean;
  muted: boolean;
  cameraOff: boolean;
  /** Voice-only call: no camera track locally or remotely. */
  audioOnly: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  /** When this side joined the room (ms epoch). */
  joinedAt: number | null;
  /** When the other participant joined — the call started (ms epoch). */
  peerJoinedAt: number | null;
  onClose: () => void;
  onHangUp: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
};

export type CallOverlayProps = CallStageProps & { opened: boolean };

/**
 * The call surface (video tiles + controls). Shared by the modal overlay and
 * inline surfaces such as the encounter "Video" tab.
 */
export function CallStage({
  status,
  error,
  peerPresent,
  muted,
  cameraOff,
  audioOnly,
  localStream,
  remoteStream,
  joinedAt,
  peerJoinedAt,
  onClose,
  onHangUp,
  onToggleMute,
  onToggleCamera,
}: CallStageProps) {
  const remoteHasVideo = Boolean(remoteStream && remoteStream.getVideoTracks().length > 0);
  const localHasVideo = Boolean(localStream && localStream.getVideoTracks().length > 0);
  const live =
    status === 'connecting' ||
    status === 'waiting' ||
    status === 'connecting-peer' ||
    status === 'connected' ||
    status === 'reconnecting';

  return (
    <Box
      style={{
        background: 'var(--mantine-color-body)',
        borderRadius: 'var(--mantine-radius-lg)',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          position: 'relative',
          background: '#0B1220',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
        }}
      >
        {remoteHasVideo ? (
          <VideoTile stream={remoteStream} muted={false} />
        ) : (
          <Stack
            align="center"
            justify="center"
            gap={8}
            style={{ height: '100%', color: 'rgba(255,255,255,0.82)' }}
          >
            {audioOnly && (
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.12)',
                }}
              >
                <Mic size={26} />
              </Box>
            )}
            <Text fw={600}>
              {audioOnly ? 'Audio call' : statusLabel(status, peerPresent, audioOnly)}
            </Text>
            {audioOnly && (
              <Text size="sm" c="rgba(255,255,255,0.6)">
                {statusLabel(status, peerPresent, true)} · voice only
              </Text>
            )}
            {error && (
              <Text size="sm" c="red.3" ta="center" px="xl">
                {error}
              </Text>
            )}
          </Stack>
        )}

        {localStream && (
          <Box
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              width: 168,
              aspectRatio: '4 / 3',
              borderRadius: 10,
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.35)',
              background: '#111827',
            }}
          >
            {localHasVideo ? (
              <VideoTile stream={localStream} muted style={{ transform: 'scaleX(-1)' }} />
            ) : (
              <Stack
                align="center"
                justify="center"
                gap={2}
                style={{ height: '100%', color: 'rgba(255,255,255,0.8)' }}
              >
                <Mic size={18} />
                <Text size="xs">You · audio</Text>
              </Stack>
            )}
          </Box>
        )}

        {status === 'connected' && (
          <Box
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              padding: '2px 10px',
              borderRadius: 999,
              background: 'rgba(22,163,74,0.9)',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Live
          </Box>
        )}

        {status === 'reconnecting' && (
          <Box
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              padding: '2px 10px',
              borderRadius: 999,
              background: 'rgba(202,138,4,0.92)',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Reconnecting…
          </Box>
        )}
      </Box>

      {(joinedAt || peerJoinedAt) && (
        <Text size="xs" c="dimmed" ta="center" pt="xs" data-testid="rtc-call-times">
          {joinedAt ? `Joined ${new Date(joinedAt).toLocaleTimeString()}` : null}
          {joinedAt && peerJoinedAt ? ' · ' : null}
          {peerJoinedAt ? `Call started ${new Date(peerJoinedAt).toLocaleTimeString()}` : null}
        </Text>
      )}

      <Group justify="center" gap="sm" p="md" style={{ background: 'var(--mantine-color-body)' }}>
        {live ? (
          <>
            <Tooltip label={muted ? 'Unmute' : 'Mute'}>
              <ActionIcon
                size="lg"
                radius="xl"
                variant={muted ? 'filled' : 'light'}
                color={muted ? 'red' : 'gray'}
                aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
                onClick={onToggleMute}
              >
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
              </ActionIcon>
            </Tooltip>
            {localHasVideo && (
              <Tooltip label={cameraOff ? 'Turn camera on' : 'Turn camera off'}>
                <ActionIcon
                  size="lg"
                  radius="xl"
                  variant={cameraOff ? 'filled' : 'light'}
                  color={cameraOff ? 'red' : 'gray'}
                  aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'}
                  onClick={onToggleCamera}
                >
                  {cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                </ActionIcon>
              </Tooltip>
            )}
            <Button
              color="red"
              radius="xl"
              leftSection={<PhoneOff size={16} />}
              onClick={onHangUp}
              data-testid="rtc-call-hangup"
            >
              End call
            </Button>
          </>
        ) : (
          <Button radius="xl" variant="light" onClick={onClose}>
            Close
          </Button>
        )}
      </Group>
    </Box>
  );
}

/** Video room shown while a consultation is live (or just ended). */
export function CallOverlay({ opened, ...stageProps }: CallOverlayProps) {
  return (
    <Modal
      opened={opened}
      onClose={stageProps.onClose}
      centered
      size="xl"
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      padding={0}
      radius="lg"
      data-testid="rtc-call-overlay"
    >
      <CallStage {...stageProps} />
    </Modal>
  );
}
