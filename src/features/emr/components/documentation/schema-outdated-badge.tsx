import { Badge, Tooltip } from '@mantine/core';
import { AlertTriangle } from 'lucide-react';

/**
 * Schema-version awareness: rendered when a submission was filled against an
 * older published schema than the form definition currently exposes.
 */
export function SchemaOutdatedBadge({
  submission,
}: {
  submission: { schemaOutdated?: boolean; formVersion?: number; schemaCurrentVersion?: number | null };
}) {
  if (!submission.schemaOutdated) return null;
  const current = submission.schemaCurrentVersion;
  return (
    <Tooltip
      label={`Filled on schema v${submission.formVersion ?? '?'} — the published schema is now v${current ?? '?'}. Values may not match the current fields.`}
      withArrow
      multiline
      w={260}
    >
      <Badge
        size="xs"
        color="orange"
        variant="light"
        leftSection={<AlertTriangle size={10} />}
        style={{ flexShrink: 0, cursor: 'default' }}
      >
        Older schema
      </Badge>
    </Tooltip>
  );
}
