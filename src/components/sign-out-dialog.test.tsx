import { fireEvent, render, screen } from '@test-utils';
import { vi } from 'vitest';
import { SignOutDialog } from './sign-out-dialog';

const navigateMock = vi.fn();

// TanStack Router's parsed search objects are null-prototype records; string
// concatenation on them throws "Cannot convert object to primitive value".
const nullProtoSearch = Object.assign(Object.create(null), { tab: 'orders' });

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
  useLocation: () => ({ pathname: '/shop/pos', search: nullProtoSearch }),
}));

const logoutMock = vi.fn();
const logoutAllMock = vi.fn(async () => {});

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    const state = { logout: logoutMock, logoutAll: logoutAllMock };
    return selector ? selector(state) : state;
  },
}));

describe('SignOutDialog', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
    logoutAllMock.mockClear();
  });

  it('signs out and redirects without throwing on a parsed search object', () => {
    render(<SignOutDialog open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/sign-in',
      search: { redirect: '/shop/pos?tab=orders' },
      replace: true,
    });
  });
});
