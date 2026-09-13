import { useHotkeys } from '@mantine/hooks';

export function useKeyboardShortcuts({ createSale, holdSale, payment }: any) {
  useHotkeys([
    ['F2', createSale],
    ['F4', holdSale],
    ['F5', payment],
  ]);
}
