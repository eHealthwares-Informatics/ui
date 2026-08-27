import { Text } from '@mantine/core';
import { useElapsedTimer } from '../../hooks/use-elapsed-timer';

export function EncounterTimer({
  startIso,
  size = 'md',
}: {
  startIso: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}) {
  const { formatted, isRunning } = useElapsedTimer(startIso);

  return (
    <Text
      component="span"
      size={size}
      fw={700}
      c={isRunning ? 'blue' : 'dimmed'}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {isRunning ? formatted : '—'}
    </Text>
  );
}
