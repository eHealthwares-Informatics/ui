import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@test-utils';
import { vi } from 'vitest';
import { ModuleContext, type ModuleContextType } from '@/context/module-context';
import { RxNotificationChannelsPage } from './index';

const { get, post, patch, del, auth } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  auth: { roles: ['admin'] as string[], permissions: ['rxsoft.admin.settings.update'] },
}));

vi.mock('@/lib/conversation-api', () => ({
  conversationApi: { get, post, patch, delete: del },
}));

vi.mock('@/lib/identity-api', () => ({
  identityApi: { get: vi.fn().mockResolvedValue({ data: { data: [] } }) },
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { roles: auth.roles, permissions: auth.permissions } }),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

const CHANNELS = [
  {
    id: 'ch-1',
    organizationId: null,
    label: 'Default SMS',
    type: 'sms',
    code: 'SMS_NBSMS',
    enabled: true,
    fallbackChannelId: null,
    testStatus: 'success',
    testRecipient: '+2348000000000',
    testMessage: 'Hello',
    testDownstreamMessage: 'Sent via SMS_NBSMS',
    testDownstreamResponse: { id: 'ex-1' },
    testedAt: '2026-11-01T12:00:00.000Z',
  },
  {
    id: 'ch-2',
    organizationId: null,
    label: 'Default Email',
    type: 'email',
    code: 'EMAIL_HS_JOHN',
    enabled: true,
    fallbackChannelId: 'ch-1',
    testStatus: null,
    testRecipient: null,
    testMessage: null,
    testDownstreamMessage: null,
    testDownstreamResponse: null,
    testedAt: null,
  },
];

const moduleValue: ModuleContextType = {
  selectedModule: 'rxsoft',
  setSelectedModule: () => undefined,
  currentModuleDefinition: {} as never,
  moduleId: 'rxsoft' as const,
  apiProvider: { get: vi.fn() } as never,
  moduleName: 'RxSoft',
  moduleDescription: '',
  moduleRoot: '/rxsoft',
  modules: [],
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ModuleContext.Provider value={moduleValue}>
        <RxNotificationChannelsPage />
      </ModuleContext.Provider>
    </QueryClientProvider>
  );
}

describe('RxNotificationChannelsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.roles = ['admin'];
    auth.permissions = ['rxsoft.admin.settings.update'];
    get.mockResolvedValue({ data: { data: CHANNELS, meta: { page: 1, limit: 25, total: 2 } } });
    post.mockResolvedValue({ data: { status: 'success', downstreamMessage: 'Sent' } });
    patch.mockResolvedValue({ data: {} });
    del.mockResolvedValue({ data: {} });
  });

  it('renders the conversation channels through the data page shell', async () => {
    renderPage();

    await waitFor(() =>
      expect(get).toHaveBeenCalledWith('/notification-channels', expect.anything())
    );
    expect(await screen.findByText('Default SMS')).toBeInTheDocument();
    expect(screen.getByText('Default Email')).toBeInTheDocument();
    expect(screen.getByText('SMS_NBSMS')).toBeInTheDocument();
  });

  it('sends a test message from the row action', async () => {
    renderPage();

    const row = await screen.findByText('Default SMS');
    const tableRow = row.closest('tr');
    expect(tableRow).not.toBeNull();
    fireEvent.click(
      within(tableRow as HTMLElement)
        .getAllByRole('button')
        .at(-1)!
    );
    fireEvent.click(await screen.findByText('Test message'));

    fireEvent.change(screen.getByLabelText('Test recipient'), {
      target: { value: '+2348000000001' },
    });
    fireEvent.click(screen.getByTestId('notification-channel-test-send'));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/notification-channels/ch-1/test',
        expect.objectContaining({ recipient: '+2348000000001' }),
        expect.anything()
      )
    );
  });

  it('adds a new channel through the standard create modal', async () => {
    renderPage();

    fireEvent.click(await screen.findByTestId('header-new'));
    const labelInput = screen.getByTestId('field-label');
    fireEvent.focus(labelInput);
    fireEvent.change(labelInput, {
      target: { value: 'Transactional SMS' },
    });
    await new Promise((resolve) => setTimeout(resolve, 700));
    fireEvent.click(screen.getByTestId('form-create'));
    await new Promise((resolve) => setTimeout(resolve, 300));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/notification-channels',
        expect.objectContaining({ label: 'Transactional SMS', type: 'sms' })
      )
    );
  });

  it('updates a channel from the standard edit modal', async () => {
    renderPage();

    const row = await screen.findByText('Default SMS');
    const tableRow = row.closest('tr') as HTMLElement;
    fireEvent.click(within(tableRow).getByTestId('row-edit'));
    fireEvent.click(await screen.findByTestId('field-enabled'));
    fireEvent.click(screen.getByTestId('form-update'));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        '/notification-channels/ch-1',
        expect.objectContaining({ enabled: false })
      )
    );
  });
});
