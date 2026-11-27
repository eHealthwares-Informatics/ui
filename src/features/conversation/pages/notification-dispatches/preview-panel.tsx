import { Alert, Badge, Code, Group, Paper, Stack, Tabs, Text } from '@mantine/core';
import { AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  buildPreview,
  type NotificationBodies,
  type PreviewChannel,
  type PreviewChannelKey,
} from './preview';

type Props = {
  /** Channel bodies from the template (`GET /notification-templates/:id`). */
  bodies: NotificationBodies | null | undefined;
  /** The parsed Context JSON the dispatch will actually send. */
  context: Record<string, unknown>;
  /** Set when the Context textarea does not hold valid JSON. */
  contextError?: string | null;
  /** Set while the template bodies are still loading. */
  loading?: boolean;
};

const CHANNEL_TESTIDS: Record<PreviewChannelKey, string> = {
  email: 'dispatch-preview-tab-email',
  sms: 'dispatch-preview-tab-sms',
  whatsapp: 'dispatch-preview-tab-whatsapp',
};

function ChannelPreview({ channel }: { channel: PreviewChannel }) {
  if (channel.error) {
    return (
      <Alert color="red" variant="light" mt="xs" data-testid="dispatch-preview-error">
        {channel.label}: {channel.error}
      </Alert>
    );
  }

  return (
    <Stack gap="xs" mt="xs">
      {channel.subject !== undefined && (
        <div>
          <Text size="xs" c="dimmed" mb={4}>
            Subject
          </Text>
          <Code block data-testid="dispatch-preview-subject">
            {channel.subject || '(empty)'}
          </Code>
        </div>
      )}

      <div>
        <Text size="xs" c="dimmed" mb={4}>
          {channel.key === 'email' ? 'Text body' : 'Message'}
        </Text>
        <Code
          block
          data-testid="dispatch-preview-text"
          style={{ whiteSpace: 'pre-wrap', maxHeight: 260, overflow: 'auto' }}
        >
          {channel.text || '(empty)'}
        </Code>
      </div>

      {channel.html !== undefined && (
        <div>
          <Text size="xs" c="dimmed" mb={4}>
            HTML body
          </Text>
          {/* Sandboxed with no permissions: the authored HTML cannot run script,
              submit a form or navigate the console. `srcDoc` keeps it same-origin
              free, so `sandbox=""` is the strictest setting that still renders. */}
          <iframe
            title="Email HTML preview"
            srcDoc={channel.html}
            sandbox=""
            data-testid="dispatch-preview-html"
            style={{
              width: '100%',
              height: 320,
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: 4,
              background: '#fff',
            }}
          />
        </div>
      )}
    </Stack>
  );
}

/**
 * Rendered preview of the notification template bodies for the dispatch Test
 * dialog: what the recipient will actually receive, rendered with the same
 * Handlebars settings as the backend (`noEscape: true`).
 *
 * It deliberately previews rather than sends — the operator can check the copy
 * (and the context they edited) before pressing "Send test".
 */
export function DispatchPreview({ bodies, context, contextError, loading }: Props) {
  const channels = useMemo(() => buildPreview(bodies, context), [bodies, context]);
  const channelsMissingParams = useMemo(
    () => channels.filter((channel) => channel.missingParams.length > 0),
    [channels]
  );
  const [active, setActive] = useState<string | null>(null);
  const current = channels.find((channel) => channel.key === active) ?? channels[0] ?? null;

  if (contextError) {
    return (
      <Alert color="yellow" variant="light" data-testid="dispatch-preview-context-error">
        Fix the Context JSON to see the rendered preview: {contextError}
      </Alert>
    );
  }

  if (!channels.length) {
    return (
      <Text size="sm" c="dimmed" data-testid="dispatch-preview-empty">
        {loading
          ? 'Loading the template bodies…'
          : 'This template has no channel bodies to preview.'}
      </Text>
    );
  }

  return (
    <Paper withBorder p="sm" data-testid="dispatch-preview">
      <Text size="xs" c="dimmed" mb={6}>
        Preview — rendered from the template with the Context above. This is what will be sent.
      </Text>

      {channelsMissingParams.length > 0 && (
        <Alert
          color="red"
          variant="light"
          icon={<AlertTriangle size={16} />}
          mb="xs"
          data-testid="dispatch-preview-missing"
        >
          <Text size="xs" fw={500}>
            Context is missing template parameters — the send fails for these bodies:
          </Text>
          <Stack gap={2} mt={4}>
            {channelsMissingParams.map((channel) => (
              <Text
                key={channel.key}
                size="xs"
                data-testid={`dispatch-preview-missing-${channel.key}`}
              >
                <strong>{channel.label}</strong>: {channel.missingParams.join(', ')}
              </Text>
            ))}
          </Stack>
          <Text size="xs" c="dimmed" mt={4}>
            Add them to the Context (an empty string is accepted).
          </Text>
        </Alert>
      )}

      <Tabs value={current?.key ?? null} onChange={setActive}>
        <Tabs.List>
          {channels.map((channel) => (
            <Tabs.Tab
              key={channel.key}
              value={channel.key}
              data-testid={CHANNEL_TESTIDS[channel.key]}
            >
              <Group gap={6} wrap="nowrap">
                {channel.label}
                {channel.missingParams.length > 0 && (
                  <Badge
                    size="xs"
                    color="red"
                    variant="light"
                    title={`Missing: ${channel.missingParams.join(', ')}`}
                    data-testid={`dispatch-preview-tab-missing-${channel.key}`}
                  >
                    {channel.missingParams.length}
                  </Badge>
                )}
              </Group>
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {/* One panel, not one per tab: the previews share a set of testids and
            rendering them all would put duplicate ids in the DOM. */}
        <Tabs.Panel value={current?.key ?? ''}>
          {current && <ChannelPreview channel={current} />}
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
