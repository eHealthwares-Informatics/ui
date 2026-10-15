import { render, screen, waitFor } from '@test-utils';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationSettingsButton } from './notification-settings';

/**
 * rxsoft-qa#804 — the notification switches live on the facility config now.
 *
 * An ordinary admin's facility comes from their token, so the console must not
 * ask them for one; a superadmin picks a facility and the request targets that
 * facility explicitly. Both read/write `notificationSettings` on the config.
 */
// `vi.mock` factories are hoisted above the module body, so the spies they
// close over have to be hoisted too.
const { get, patch, auth } = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  auth: { roles: ['admin'] as string[] },
}));

// Stable references, like react-query's cached `data` — a fresh array per
// render would re-trigger the load effect forever.
const SCENARIO_CATALOG = [
  { scenario: 'refill_due', label: 'Refill due' },
  { scenario: 'promotion', label: 'Promotional campaign' },
];
const ORGANIZATIONS = [{ id: 'org_other', name: 'Other facility' }];

vi.mock('@/lib/rxsoft-api', () => ({
  rxsoftApi: { get, patch },
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { roles: auth.roles, organizationId: 'org1' } }),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
      if (queryKey[1] === 'notification-scenarios') {
        return { data: SCENARIO_CATALOG, isLoading: false };
      }
      return { data: ORGANIZATIONS, isLoading: false };
    },
    useMutation: (options: { mutationFn: () => Promise<unknown> }) => ({
      mutate: () => options.mutationFn(),
      isPending: false,
    }),
  };
});

async function openModal() {
  fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
}

describe('NotificationSettingsButton — org-config surface (rxsoft-qa#804)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.roles = ['admin'];
    get.mockResolvedValue({
      data: { data: { notificationSettings: { 'email:promotion': false } } },
    });
    patch.mockResolvedValue({ data: { data: {} } });
  });

  it('loads the switches from the facility config without asking for a facility', async () => {
    render(<NotificationSettingsButton />);
    await openModal();

    await waitFor(() => expect(get).toHaveBeenCalledWith('/organisation-config'));
    // Ordinary admins get no facility picker — the server takes it from the token.
    expect(screen.queryByLabelText(/Facility/i)).not.toBeInTheDocument();
  });

  it('reflects the stored switches and saves them back as notificationSettings', async () => {
    render(<NotificationSettingsButton />);
    await openModal();

    await waitFor(() =>
      expect(screen.getByLabelText('Email — Promotional campaign')).not.toBeChecked()
    );
    // Never-configured keys default to on.
    expect(screen.getByLabelText('SMS — Promotional campaign')).toBeChecked();

    // Save stays disabled until the load settles — wait for that, not just for
    // the switches to reflect the response.
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith('/organisation-config', {
      notificationSettings: {
        'email:refill_due': true,
        'email:promotion': false,
        'sms:refill_due': true,
        'sms:promotion': true,
        'whatsapp:refill_due': true,
        'whatsapp:promotion': true,
      },
    });
  });

  it('targets the picked facility explicitly for a superadmin', async () => {
    auth.roles = ['super_admin'];
    render(<NotificationSettingsButton />);
    await openModal();

    await waitFor(() =>
      expect(get).toHaveBeenCalledWith('/organisation-config/by-organization/org_other')
    );
  });
});
