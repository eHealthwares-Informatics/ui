import { notifications } from '@mantine/notifications';
import { fireEvent, render, screen, waitFor } from '@test-utils';
import { vi } from 'vitest';
import VerifyEmailPage from './verify-email';

/**
 * rxsoft-qa#792 — a verification link that has expired or been consumed used to
 * leave the user with only "Continue Shopping": the client already shipped
 * `websiteApi.requestEmailVerification`, but nothing rendered a control for it.
 */

const verifyEmailMock = vi.fn();
const requestEmailVerificationMock = vi.fn();

vi.mock('../website/api', () => ({
  websiteApi: {
    verifyEmail: (...args: unknown[]) => verifyEmailMock(...args),
    requestEmailVerification: (...args: unknown[]) => requestEmailVerificationMock(...args),
  },
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

// Keep the page's own behaviour under test — not the shop chrome.
vi.mock('../website/layout', () => ({
  WebsiteLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  green: '#2e7d32',
  ink: '#111',
  muted: '#666',
  line: '#eee',
  buttonStyles: {},
}));

describe('VerifyEmailPage — resend verification (rxsoft-qa#792)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyEmailMock.mockRejectedValue(new Error('invalid token'));
  });

  async function renderErrorState(email?: string) {
    render(<VerifyEmailPage token="expired-token" email={email} />);
    await screen.findByText(/Verification Failed/i);
  }

  it('offers a resend control on the error state', async () => {
    await renderErrorState();
    expect(screen.getByTestId('resend-verification')).toBeInTheDocument();
    expect(screen.getByTestId('resend-email')).toBeInTheDocument();
  });

  it('sends a resend request and confirms it', async () => {
    requestEmailVerificationMock.mockResolvedValue({ sent: true });
    await renderErrorState();

    fireEvent.change(screen.getByTestId('resend-email'), {
      target: { value: 'shopper@example.com' },
    });
    fireEvent.click(screen.getByTestId('resend-verification'));

    await waitFor(() =>
      expect(requestEmailVerificationMock).toHaveBeenCalledWith({ email: 'shopper@example.com' })
    );
    await waitFor(() =>
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ color: 'green' }))
    );
  });

  it('hints to sign in when the address is already verified', async () => {
    requestEmailVerificationMock.mockResolvedValue({ sent: false, alreadyVerified: true });
    await renderErrorState('already@example.com');

    fireEvent.click(screen.getByTestId('resend-verification'));

    await waitFor(() =>
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'blue', title: 'Already verified' })
      )
    );
  });

  it('does not call the API without an email', async () => {
    await renderErrorState();
    fireEvent.click(screen.getByTestId('resend-verification'));

    await waitFor(() =>
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ color: 'orange' }))
    );
    expect(requestEmailVerificationMock).not.toHaveBeenCalled();
  });

  it('surfaces a failed resend as an error toast', async () => {
    requestEmailVerificationMock.mockRejectedValue(new Error('boom'));
    await renderErrorState('shopper@example.com');

    fireEvent.click(screen.getByTestId('resend-verification'));

    await waitFor(() =>
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }))
    );
  });
});
