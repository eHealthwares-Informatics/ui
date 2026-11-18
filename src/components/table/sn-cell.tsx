import { Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';

/** Short monospace id label; the full id stays in the element title. */
export function shortIdValue(value: unknown): string {
  const id = String(value ?? '');
  if (!id) {
    return '—';
  }
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

/** Copy an id to the clipboard and toast the result. */
export async function copyIdValue(value: unknown): Promise<void> {
  const id = String(value ?? '');
  if (!id) {
    return;
  }
  try {
    await navigator.clipboard.writeText(id);
    notifications.show({ color: 'green', title: 'ID copied', message: id });
  } catch {
    notifications.show({
      color: 'red',
      title: 'Copy failed',
      message: 'Clipboard is unavailable',
    });
  }
}

const linkButtonStyle: React.CSSProperties = {
  cursor: 'pointer',
  background: 'none',
  border: 0,
  padding: 0,
  font: 'inherit',
  color: 'var(--mantine-color-blue-6)',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

function copyOnClick(event: React.MouseEvent, value: string) {
  // Do not trigger the row click (view modal) when copying an id.
  event.stopPropagation();
  void copyIdValue(value);
}

/**
 * Serial-number cell: a link that copies the row id (with a toast). Reused by
 * `DataTable` when `copyRowIdOnSn` is set.
 */
export function SnCell({ index, id, testId }: { index: number; id: unknown; testId?: string }) {
  const value = String(id ?? '');
  if (!value) {
    return <Text size="sm">{index + 1}</Text>;
  }
  return (
    <Tooltip label={value} withArrow>
      <Text
        component="button"
        type="button"
        size="sm"
        data-testid={testId}
        title={value}
        aria-label={`Copy row ID ${value}`}
        onClick={(event) => copyOnClick(event, value)}
        style={linkButtonStyle}
      >
        {index + 1}
      </Text>
    </Tooltip>
  );
}

/**
 * Id cell: short monospace text that copies the full value on click/tap. Used
 * for id columns (row id, channelId, templateId, …) so support can grab ids
 * without the row click opening the view modal. The full id is the title.
 */
export function CopyIdCell({
  value,
  testId,
  empty = '—',
}: {
  value: unknown;
  testId?: string;
  empty?: string;
}) {
  const id = String(value ?? '');
  if (!id) {
    return (
      <Text size="xs" c="dimmed">
        {empty}
      </Text>
    );
  }
  return (
    <Tooltip label={`Copy ID: ${id}`} withArrow>
      <Text
        component="button"
        type="button"
        size="xs"
        ff="monospace"
        data-testid={testId}
        title={id}
        aria-label={`Copy ID ${id}`}
        onClick={(event) => copyOnClick(event, id)}
        style={linkButtonStyle}
      >
        {shortIdValue(id)}
      </Text>
    </Tooltip>
  );
}
