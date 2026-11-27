import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ModuleProvider } from '@/context/module-provider';
import type { ModelConfig } from '@/features/shared/model-schema';
import { ViewModal } from './view-modal';

function renderViewModal() {
  const apiProvider = {
    get: vi.fn().mockResolvedValue({ data: { data: { id: '1', name: 'Alice' } } }),
  } as any;
  const config: ModelConfig = {
    id: 'widgets',
    title: 'Widgets',
    endpoint: '/widgets',
    columns: [{ key: 'name', label: 'Name' }],
    apiProvider,
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <ModuleProvider>
        <ViewModal config={config} row={{ id: '1', name: 'Alice' }} open onClose={() => {}} />
      </ModuleProvider>
    </QueryClientProvider>
  );
}

describe('ViewModal', () => {
  it('renders the record title exactly once (no duplicate modal header)', async () => {
    renderViewModal();

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    // GenericViewComponent owns the title; the modal must not render a second one.
    expect(screen.getAllByText('Widgets Details')).toHaveLength(1);
  });
});
