import { render, screen, waitFor } from '@test-utils';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationPreferencesCard } from './notification-preferences';

/**
 * Storefront notification preferences (SRS 7.9 / rxsoft#18 2/2).
 *
 * The card is opt-OUT: the API defaults every channel to true, so the switches
 * start on and only the ones the customer flips are persisted.
 */
const mutate = vi.fn();
let preferenceData: { email: boolean; sms: boolean; whatsapp: boolean } | undefined = {
  email: true,
  sms: true,
  whatsapp: true,
};

vi.mock('./hooks', () => ({
  useNotificationPreferences: () => ({ data: preferenceData, isLoading: false }),
  useUpdateNotificationPreferences: () => ({ mutate, isPending: false }),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

describe('NotificationPreferencesCard (SRS 7.9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preferenceData = { email: true, sms: true, whatsapp: true };
  });

  it('renders one switch per channel, all on by default', () => {
    render(<NotificationPreferencesCard />);

    expect(screen.getByTestId('notification-preference-email')).toBeChecked();
    expect(screen.getByTestId('notification-preference-sms')).toBeChecked();
    expect(screen.getByTestId('notification-preference-whatsapp')).toBeChecked();
  });

  it('reflects the stored preferences from the API', () => {
    preferenceData = { email: false, sms: true, whatsapp: false };

    render(<NotificationPreferencesCard />);

    expect(screen.getByTestId('notification-preference-email')).not.toBeChecked();
    expect(screen.getByTestId('notification-preference-sms')).toBeChecked();
    expect(screen.getByTestId('notification-preference-whatsapp')).not.toBeChecked();
  });

  it('saves the whole preference set, including the channels the customer turned off', async () => {
    render(<NotificationPreferencesCard />);

    fireEvent.click(screen.getByTestId('notification-preference-sms'));
    fireEvent.click(screen.getByTestId('notification-preferences-save'));

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({ email: true, sms: false, whatsapp: true });
  });

  it('lets a customer turn a channel back on', async () => {
    preferenceData = { email: false, sms: false, whatsapp: false };

    render(<NotificationPreferencesCard />);
    fireEvent.click(screen.getByTestId('notification-preference-email'));
    fireEvent.click(screen.getByTestId('notification-preferences-save'));

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({ email: true, sms: false, whatsapp: false });
  });

  it('does not save anything until the customer asks', () => {
    render(<NotificationPreferencesCard />);

    fireEvent.click(screen.getByTestId('notification-preference-whatsapp'));

    expect(mutate).not.toHaveBeenCalled();
  });
});
