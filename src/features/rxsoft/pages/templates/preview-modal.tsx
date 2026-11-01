import { Box, Group, Modal, Stack, Text } from '@mantine/core';
import { previewTemplateBody, renderTemplate, type PrintTemplateKind } from '@/lib/print-template';

export type TemplatePreview = {
  name: string;
  type: 'print' | 'notification';
  kind: string;
  body: string;
  subject?: string | null;
  channel?: string | null;
};

/** Sample values for notification copy so the preview reads like a real send. */
const SAMPLE_NOTIFICATION_VALUES: Record<string, string> = {
  'customer.name': 'Ada Obi',
  'order.number': 'SO-2026-0001',
  'order.total': '₦3,510.00',
  'organization.name': 'Damorex Pharmacy',
  'pickup.location': 'Ikeja — Allen Avenue',
};

function previewNotificationText(body: string): string {
  return renderTemplate(body, { values: SAMPLE_NOTIFICATION_VALUES, blocks: {} });
}

/**
 * Preview of exactly what a template produces. Print templates render through
 * the same function the POS uses, so what is shown here is what prints.
 */
export function TemplatePreviewModal({
  preview,
  onClose,
}: {
  preview: TemplatePreview | null;
  onClose: () => void;
}) {
  const isPrint = preview?.type === 'print';
  const printHtml =
    preview && isPrint ? previewTemplateBody(preview.kind as PrintTemplateKind, preview.body) : '';

  return (
    <Modal
      opened={Boolean(preview)}
      onClose={onClose}
      title={preview ? `Preview — ${preview.name}` : 'Preview'}
      size={isPrint ? 'xl' : 'lg'}
      data-testid="template-preview-modal"
    >
      {preview && isPrint && (
        <Stack gap="xs">
          <Text size="xs" c="dimmed">
            Rendered with a sample sale. Placeholders are resolved the same way as on the printed
            document.
          </Text>
          <Box
            style={{
              border: '1px solid var(--app-line)',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <iframe
              title="Print template preview"
              srcDoc={printHtml}
              style={{ width: '100%', height: '60vh', border: 'none', background: '#fff' }}
              data-testid="template-preview-iframe"
            />
          </Box>
        </Stack>
      )}

      {preview && !isPrint && (
        <Stack gap="sm">
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Channel
            </Text>
            <Text size="xs" fw={600}>
              {preview.channel ?? '—'}
            </Text>
          </Group>

          {preview.subject && (
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Subject
              </Text>
              <Text size="sm" fw={600}>
                {previewNotificationText(preview.subject)}
              </Text>
            </Stack>
          )}

          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              Message
            </Text>
            <Box
              p="sm"
              style={{
                border: '1px solid var(--app-line)',
                borderRadius: 8,
                background: 'var(--app-surface)',
                whiteSpace: 'pre-wrap',
              }}
              data-testid="template-preview-message"
            >
              <Text size="sm">{previewNotificationText(preview.body)}</Text>
            </Box>
          </Stack>

          <Text size="xs" c="dimmed">
            Sample values: {Object.entries(SAMPLE_NOTIFICATION_VALUES)
              .map(([key, value]) => `{{${key}}} → ${value}`)
              .join(' · ')}
          </Text>
        </Stack>
      )}
    </Modal>
  );
}
