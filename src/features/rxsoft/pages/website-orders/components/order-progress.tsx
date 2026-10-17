import { Box, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { Fragment } from 'react';
import { ORDER_TIMELINE, STATUS_ICONS, statusLabel } from '../status';

/**
 * Horizontal (left → right) fulfilment progress for a website order.
 * Cancelled orders render the timeline greyed with an explicit Cancelled chip.
 */
export function OrderProgress({ status }: { status: string }) {
  const currentIdx = (ORDER_TIMELINE as readonly string[]).indexOf(status);
  const cancelled = status === 'cancelled';

  return (
    <Stack gap="xs" data-testid="order-progress">
      <Group gap={0} wrap="nowrap" align="flex-start">
        {ORDER_TIMELINE.map((step, i) => {
          const done = !cancelled && i <= currentIdx;
          const isCurrent = step === status;
          return (
            <Fragment key={step}>
              <Stack gap={4} align="center" style={{ minWidth: 92 }}>
                <ThemeIcon
                  radius="xl"
                  size="lg"
                  variant={done ? 'filled' : 'light'}
                  color={cancelled ? 'gray' : done ? 'blue' : 'gray'}
                >
                  {STATUS_ICONS[step]}
                </ThemeIcon>
                <Text
                  size="xs"
                  ta="center"
                  c={isCurrent ? undefined : 'dimmed'}
                  fw={isCurrent ? 700 : 400}
                >
                  {statusLabel(step)}
                </Text>
              </Stack>
              {i < ORDER_TIMELINE.length - 1 && (
                <Box
                  aria-hidden
                  style={{
                    flex: 1,
                    height: 2,
                    marginTop: 18,
                    background:
                      !cancelled && i < currentIdx
                        ? 'var(--mantine-color-blue-6)'
                        : 'var(--mantine-color-gray-3)',
                  }}
                />
              )}
            </Fragment>
          );
        })}
      </Group>
      {cancelled && (
        <Text size="sm" c="red" fw={600} data-testid="order-progress-cancelled">
          This order was cancelled.
        </Text>
      )}
    </Stack>
  );
}
