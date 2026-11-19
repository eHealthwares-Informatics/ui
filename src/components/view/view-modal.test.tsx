import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@test-utils';
import { vi } from 'vitest';
import { ModuleContext } from '@/context/module-context';
import type { ModelConfig } from '@/features/shared/model-schema';
import { ViewModal } from './view-modal';

/**
 * Row click → detail modal. Regression: the detail request used to re-fire on
 * every render of the modal (the derived view object was recreated each time),
 * hammering `GET /resource/:id` while the modal stayed on "Loading…".
 */
function buildConfig(get: ReturnType<typeof vi.fn>): ModelConfig {
  return {
    id: 'things',
    title: 'Thing',
    endpoint: '/things',
    columns: [{ key: 'name', label: 'Name' }],
    queryKeyBase: ['things'],
    apiProvider: { get } as never,
  } as ModelConfig;
}

function renderModal(config: ModelConfig, row: Record<string, unknown> = { id: 'thing-1' }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const moduleContext = {
    selectedModule: 'conversation',
    setSelectedModule: () => undefined,
    moduleId: 'conversation',
    apiProvider: { get: vi.fn() } as never,
  } as never;
  const ui = (cfg: ModelConfig) => (
    <QueryClientProvider client={client}>
      <ModuleContext.Provider value={moduleContext}>
        <ViewModal config={cfg} row={row} open onClose={() => undefined} />
      </ModuleContext.Provider>
    </QueryClientProvider>
  );
  return { ...render(ui(config)), ui };
}

describe('ViewModal detail loading', () => {
  it('requests the detail endpoint exactly once', async () => {
    const get = vi.fn().mockResolvedValue({ data: { data: { id: 'thing-1', name: 'Alpha' } } });
    const { ui, rerender } = renderModal(buildConfig(get));

    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(get).toHaveBeenCalledWith('/things/thing-1');

    // A parent re-render hands over a new config object; that must not refetch.
    rerender(ui(buildConfig(get)));
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when the row has no identifier', async () => {
    const get = vi.fn().mockResolvedValue({ data: { data: {} } });
    renderModal(buildConfig(get), { name: 'No id' });

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(get).not.toHaveBeenCalled();
  });
});
