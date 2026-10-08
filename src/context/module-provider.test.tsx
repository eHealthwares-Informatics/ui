import { act, render, screen } from '@test-utils';
import { useEffect } from 'react';
import { ModuleProvider } from '@/context/module-provider';
import { useAuthStore } from '@/stores/auth-store';

let childMounts = 0;

function Child() {
  useEffect(() => {
    childMounts += 1;
  }, []);
  return <div data-testid="module-provider-child">child</div>;
}

describe('ModuleProvider', () => {
  beforeEach(() => {
    childMounts = 0;
    localStorage.clear();
    useAuthStore.setState({ modules: [] });
  });

  it('mounts its children exactly once', () => {
    render(
      <ModuleProvider>
        <Child />
      </ModuleProvider>
    );
    expect(childMounts).toBe(1);
  });

  // Regression for ehealthwares/ui#84: the provider used to declare an inline
  // `AppBootstrap` component, so every provider re-render gave it a new
  // component identity and React unmounted/remounted the entire subtree
  // (destroying page headers mid-interaction). A provider re-render must only
  // re-render children, never remount them.
  it('does not remount children when the module list changes', () => {
    render(
      <ModuleProvider>
        <Child />
      </ModuleProvider>
    );
    expect(childMounts).toBe(1);

    act(() => {
      useAuthStore.setState({
        modules: [{ id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy Admin', root: '/items' }],
      });
    });

    expect(childMounts).toBe(1);
    expect(screen.getByTestId('module-provider-child')).toBeInTheDocument();
  });

  it('keeps a stable context value across re-renders', () => {
    render(
      <ModuleProvider>
        <Child />
      </ModuleProvider>
    );
    const first = screen.getByTestId('module-provider-child');
    act(() => {
      useAuthStore.setState({
        modules: [{ id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy Admin', root: '/items' }],
      });
    });
    const second = screen.getByTestId('module-provider-child');
    expect(second).toBe(first);
  });
});
