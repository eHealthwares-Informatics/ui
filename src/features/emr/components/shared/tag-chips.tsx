import { Badge } from '@mantine/core';
import type { TagSummary } from '../../lib/tag-types';

const FALLBACK_COLOR = '#868e96';

/** Renders a patient's tags as small colored chips. */
export function TagChips({ tags }: { tags: TagSummary[] | undefined | null }) {
  if (!tags || tags.length === 0) {
    return <span style={{ color: 'var(--mantine-color-dimmed)' }}>—</span>;
  }
  return (
    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          size="sm"
          variant="light"
          styles={{
            root: {
              backgroundColor: `${tag.color ?? FALLBACK_COLOR}22`,
              color: tag.color ?? FALLBACK_COLOR,
            },
          }}
        >
          {tag.name}
        </Badge>
      ))}
    </span>
  );
}
