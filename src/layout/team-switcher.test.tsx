import { render, screen } from '@test-utils';
import { TeamSwitcher } from './team-switcher';
import { ModuleProvider } from '@/context/module-provider';

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => <div data-testid="link" data-to={props.to}>{children}</div>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock auth store — Zustand passes a selector function, so we need to invoke it
const mockState = {
  modules: [] as any[],
  user: { username: 'test' } as any,
  fetchModules: vi.fn(),
};

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (state: typeof mockState) => any) =>
    selector ? selector(mockState) : mockState,
}));

function renderWithProviders(ui: React.ReactNode) {
  return render(<ModuleProvider>{ui}</ModuleProvider>);
}

describe('TeamSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockState.modules = [];
    mockState.user = { username: 'test' };
    mockState.fetchModules = vi.fn();
  });

  it('shows loader when no modules are available', () => {
    const { container } = renderWithProviders(<TeamSwitcher />);
    // Mantine Loader renders an SVG with class containing 'mantine-Loader'
    const loader = container.querySelector('[class*="Loader"]');
    expect(loader).toBeInTheDocument();
  });

  it('shows active team name when modules are loaded', () => {
    mockState.modules = [
      { id: 'conversation', name: 'Conversation', description: 'Chat', root: '/conversation' },
    ];
    renderWithProviders(<TeamSwitcher />);
    expect(screen.getByText('Conversation')).toBeInTheDocument();
  });

  it('shows team plan/description', () => {
    mockState.modules = [
      { id: 'conversation', name: 'Conversation', description: 'Chat', root: '/conversation' },
    ];
    renderWithProviders(<TeamSwitcher />);
    expect(screen.getByText('Workflow Chat')).toBeInTheDocument();
  });

  it('renders the team switcher trigger button', () => {
    mockState.modules = [
      { id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy', root: '/items' },
    ];
    renderWithProviders(<TeamSwitcher />);
    expect(screen.getByTestId('team-switcher-trigger')).toBeInTheDocument();
  });

  it('shows multiple teams', () => {
    mockState.modules = [
      { id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy', root: '/items' },
      { id: 'conversation', name: 'Conversation', description: 'Chat', root: '/conversation' },
    ];
    renderWithProviders(<TeamSwitcher />);
    expect(screen.getByText('RxSoft')).toBeInTheDocument();
    expect(screen.getByText('Pharmacy Admin')).toBeInTheDocument();
  });

  it('calls fetchModules when user exists but modules are empty', () => {
    mockState.modules = [];
    renderWithProviders(<TeamSwitcher />);
    expect(mockState.fetchModules).toHaveBeenCalled();
  });

  it('does not call fetchModules when modules are already loaded', () => {
    mockState.modules = [
      { id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy', root: '/items' },
    ];
    renderWithProviders(<TeamSwitcher />);
    expect(mockState.fetchModules).not.toHaveBeenCalled();
  });

  it('renders the ChevronsUpDown icon in the trigger', () => {
    mockState.modules = [
      { id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy', root: '/items' },
    ];
    const { container } = renderWithProviders(<TeamSwitcher />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('uses first module as active when moduleId does not match', () => {
    mockState.modules = [
      { id: 'unknown-module', name: 'Unknown', description: 'Desc', root: '/unknown' },
    ];
    renderWithProviders(<TeamSwitcher />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
  });
});
