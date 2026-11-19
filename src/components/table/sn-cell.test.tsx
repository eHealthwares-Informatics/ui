import { fireEvent, render, screen, waitFor } from '@test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyIdCell, SnCell } from './sn-cell';

vi.mock('@mantine/notifications', () => ({ notifications: { show: vi.fn() } }));

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

describe('SnCell', () => {
  it('shows the serial number, not the id', () => {
    render(<SnCell index={2} id="6afc1a1d0b0922cd791c1a1b" />);

    expect(screen.getByRole('button')).toHaveTextContent('3');
    expect(screen.queryByText('6afc1a1d0b0922cd791c1a1b')).toBeNull();
  });

  it('copies the id on click', async () => {
    render(<SnCell index={0} id="abc123" />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('abc123'));
  });
});

describe('CopyIdCell', () => {
  it('shows a short id and copies the full id on click', async () => {
    render(<CopyIdCell value="6afc1a1d0b0922cd791c1a1b" />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('6afc1a…1a1b');

    fireEvent.click(button);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('6afc1a1d0b0922cd791c1a1b'));
  });

  it('renders a dash when the id is empty', () => {
    render(<CopyIdCell value={null} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
