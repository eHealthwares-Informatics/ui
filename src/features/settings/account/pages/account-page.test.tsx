import { render, within, cleanup } from '@test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsAccount } from './account-page';

afterEach(() => cleanup());

function hasText(container: HTMLElement, text: string) {
  return within(container).getAllByText(text).length > 0;
}

describe('SettingsAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Basic information section with name and email fields', () => {
    const { container } = render(<SettingsAccount />);

    expect(hasText(container, 'Basic information')).toBe(true);
    expect(hasText(container, 'First name')).toBe(true);
    expect(hasText(container, 'Last name')).toBe(true);
    expect(hasText(container, 'Email')).toBe(true);
    expect(within(container).getByPlaceholderText('First name')).toBeInTheDocument();
    expect(within(container).getByPlaceholderText('Last name')).toBeInTheDocument();
    expect(within(container).queryByPlaceholderText('Email')).toBeNull(); // read-only, no placeholder
  });

  it('renders the GitHub, GitLab and Google account fields', () => {
    const { container } = render(<SettingsAccount />);

    expect(hasText(container, 'GitHub username')).toBe(true);
    expect(within(container).getByPlaceholderText('GitHub username')).toBeInTheDocument();
    expect(hasText(container, 'GitLab username')).toBe(true);
    expect(hasText(container, 'Google account')).toBe(true);
  });

  it('renders the Notifications section with subscribed toggles', () => {
    const { container } = render(<SettingsAccount />);

    expect(hasText(container, 'Notifications')).toBe(true);
    expect(hasText(container, 'Weekly digest')).toBe(true);
    expect(hasText(container, 'New error emails')).toBe(true);
    expect(within(container).getAllByText('Subscribed').length).toBe(2);
  });

  it('renders the Two-factor authentication section', () => {
    const { container } = render(<SettingsAccount />);

    expect(hasText(container, 'Two-factor authentication')).toBe(true);
    expect(hasText(container, 'Disabled')).toBe(true);
    expect(hasText(container, 'Scan this code')).toBe(true);
    expect(within(container).getByPlaceholderText('Enter code')).toBeInTheDocument();
  });

  it('renders the Config for allowed modules section (regression: feature not lost)', () => {
    const { container } = render(<SettingsAccount />);

    expect(hasText(container, 'Config for allowed modules')).toBe(true);
    expect(within(container).getByTestId('account-allowed-modules')).toBeInTheDocument();
  });
});
