import { act, render, screen } from '@test-utils';
import { useSyncExternalStore } from 'react';
import { ModuleProvider } from '@/context/module-provider';
import { TeamSwitcher } from './team-switcher';

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => (
    <div data-testid="link" data-to={props.to}>
      {children}
    </div>
  ),
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
  useAuthStore: (selector?: (state: typeof mockState) => any) => {
    // Re-render on store changes, like a real Zustand subscription.
    useSyncExternalStore(
      (onChange: () => void) => {
        subscribers.add(onChange);
        return () => subscribers.delete(onChange);
      },
      () => selector?.(mockState) ?? mockState
    );
    return selector ? selector(mockState) : mockState;
  },
}));

// Simple external-store emulation so TeamSwitcher re-renders when modules
// change between tests (mirrors the real Zustand behaviour on logout).
const subscribers = new Set<() => void>();
function setModules(modules: any[]) {
  mockState.modules = modules;
  subscribers.forEach((fn) => fn());
}

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
    mockState.modules = [{ id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy', root: '/items' }];
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
    mockState.modules = [{ id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy', root: '/items' }];
    renderWithProviders(<TeamSwitcher />);
    expect(mockState.fetchModules).not.toHaveBeenCalled();
  });

  it('renders the ChevronsUpDown icon in the trigger', () => {
    mockState.modules = [{ id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy', root: '/items' }];
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

  it('re-renders safely when modules clear on logout (hook order regression)', () => {
    mockState.modules = [{ id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy', root: '/items' }];
    const { container } = renderWithProviders(<TeamSwitcher />);
    expect(screen.getByTestId('team-switcher-trigger')).toBeInTheDocument();

    // Logout clears the module list: previously this crashed with
    // "Rendered fewer hooks than expected" because useState ran only in the
    // populated branch.
    act(() => {
      setModules([]);
    });
    expect(container.querySelector('[class*="Loader"]')).toBeInTheDocument();
    expect(screen.queryByTestId('team-switcher-trigger')).toBeNull();
  });
});
