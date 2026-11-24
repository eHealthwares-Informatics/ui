import { Badge, Box, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { Video } from 'lucide-react';
import { useCall } from '@/lib/rtc/use-call';
import { CallStage } from './call-overlay';

type CallPanelProps = {
  /** Room to join (the appointment's conversation id). */
  callId: string | null;
  title?: string;
  description?: string;
  /** Voice-only consultation. */
  audioOnly?: boolean;
  joinLabel?: string;
};

/**
 * Inline call surface for pages that host a consultation (e.g. the encounter
 * Video tab). Shows a join prompt until the user joins, then renders the live
 * video stage in place — no modal required.
 */
export function CallPanel({
  callId,
  title = 'Video consultation',
  description,
  audioOnly,
  joinLabel = 'Join video call',
}: CallPanelProps) {
  const call = useCall({});
  const inThisCall = Boolean(callId) && call.callId === callId && call.status !== 'idle';
  const live = inThisCall && call.active;
  const failed = inThisCall && (call.status === 'ended' || call.status === 'error');

  if (!callId) {
    return (
      <Card withBorder radius="md" padding="lg" data-testid="encounter-video-panel">
        <Stack align="center" gap="xs" py="lg">
          <Video size={36} strokeWidth={1.4} />
          <Title order={4}>No consultation room yet</Title>
          <Text size="sm" c="dimmed" ta="center" maw={440}>
            The patient joins the consultation from chat. Once they open the call from their
            conversation, the room becomes available here.
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card withBorder radius="md" padding="lg" data-testid="encounter-video-panel">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={2}>
            <Title order={4}>{title}</Title>
            {description && (
              <Text size="sm" c="dimmed">
                {description}
              </Text>
            )}
          </Stack>
          <Badge
            color={live ? 'green' : inThisCall ? 'yellow' : 'gray'}
            variant="light"
            data-testid="encounter-video-status"
          >
            {live ? 'Live' : inThisCall ? call.status.replace('-', ' ') : 'Not joined'}
          </Badge>
        </Group>

        {inThisCall ? (
          <Box
            style={{
              borderRadius: 'var(--mantine-radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--mantine-color-default-border)',
            }}
          >
            <CallStage
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
          </Box>
        ) : (
          <Stack align="center" py="xl" gap="sm">
            <Video size={40} strokeWidth={1.4} />
            <Text size="sm" c="dimmed" ta="center" maw={440}>
              Join the consultation room to see and hear the patient. Camera and microphone access
              is requested when you join.
            </Text>
            <Button
              leftSection={<Video size={16} />}
              onClick={() => call.start(callId, { audioOnly })}
              data-testid="encounter-video-join"
            >
              {joinLabel}
            </Button>
            {failed && call.error && (
              <Text size="sm" c="red" ta="center">
                {call.error}
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
