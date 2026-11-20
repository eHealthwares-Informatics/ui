import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, within, cleanup } from '@test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleProvider } from '@/context/module-provider';
import { SettingsAccount } from './account-page';

vi.mock('@/features/rxsoft/pages/user-insights/api', () => ({
  getMyPosConfig: vi.fn().mockResolvedValue({
    storeId: 'store-1',
    stockLocation: { id: 'loc-1', name: 'Main Store' },
    allowPos: true,
    allowA4Print: false,
    loginTimeoutMinutes: 30,
    autoSelectLocation: true,
  }),
}));

afterEach(() => cleanup());

function renderAccount() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ModuleProvider>
        <SettingsAccount />
      </ModuleProvider>
    </QueryClientProvider>
  );
}

function hasText(container: HTMLElement, text: string) {
  return within(container).getAllByText(text).length > 0;
}

describe('SettingsAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the editable Basic information section', () => {
    const { container } = renderAccount();

    expect(hasText(container, 'Basic information')).toBe(true);
    expect(hasText(container, 'First name')).toBe(true);
    expect(hasText(container, 'Last name')).toBe(true);
    expect(hasText(container, 'Email')).toBe(true);
    expect(hasText(container, 'Phone')).toBe(true);
    expect(within(container).getByTestId('account-first-name')).toBeInTheDocument();
    expect(within(container).getByTestId('account-last-name')).toBeInTheDocument();
    expect(within(container).getByTestId('account-email')).toBeInTheDocument();
    expect(within(container).getByTestId('account-phone')).toBeInTheDocument();
    expect(within(container).getByTestId('account-save')).toBeInTheDocument();
  });

  it('renders the module-specific settings section', () => {
    const { container } = renderAccount();

    expect(within(container).getByTestId('account-module-settings')).toBeInTheDocument();
    expect(within(container).getByTestId('account-module-badge')).toBeInTheDocument();
  });

  it('renders the Notifications section with subscribed toggles', () => {
    const { container } = renderAccount();

    expect(hasText(container, 'Notifications')).toBe(true);
    expect(hasText(container, 'Weekly digest')).toBe(true);
    expect(hasText(container, 'New error emails')).toBe(true);
    expect(within(container).getAllByText('Subscribed').length).toBe(2);
  });

  it('renders the Two-factor authentication section', () => {
    const { container } = renderAccount();

    expect(hasText(container, 'Two-factor authentication')).toBe(true);
    expect(hasText(container, 'Disabled')).toBe(true);
    expect(hasText(container, 'Scan this code')).toBe(true);
    expect(within(container).getByPlaceholderText('Enter code')).toBeInTheDocument();
  });

  it('renders the Config for allowed modules section (regression: feature not lost)', () => {
    const { container } = renderAccount();

    expect(hasText(container, 'Config for allowed modules')).toBe(true);
    expect(within(container).getByTestId('account-allowed-modules')).toBeInTheDocument();
  });
});
