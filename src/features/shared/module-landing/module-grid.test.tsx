import { fireEvent, render, screen } from '@test-utils';
import { vi } from 'vitest';
import { ModuleGrid } from './module-grid';

const navigateMock = vi.fn();
const setSelectedModuleMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/context/module-context', () => ({
  useSetSelectedModule: () => setSelectedModuleMock,
}));

const modules = [
  { id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy Admin', root: '/items' },
  { id: 'lis', name: 'LIS', description: 'Laboratory', root: '/lis' },
  { id: 'emr', name: 'EMR', description: 'Electronic Medical Record', root: '/emr' },
];

/**
 * ROLE-level enforcement's presentational half: the grid renders exactly the
 * permission-derived module list from /auth/me and switches module context +
 * navigates to the module dashboard on click.
 */
describe('ModuleGrid', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    setSelectedModuleMock.mockClear();
  });

  it('renders one card per available module with testids', () => {
    render(<ModuleGrid modules={modules} />);

    expect(screen.getByTestId('module-grid')).toBeInTheDocument();
    expect(screen.getByTestId('module-card-rxsoft')).toBeInTheDocument();
    expect(screen.getByTestId('module-card-lis')).toBeInTheDocument();
    expect(screen.getByTestId('module-card-emr')).toBeInTheDocument();
  });

  it('clicking a card switches the module context and navigates to the module dashboard', () => {
    const onSelect = vi.fn();
    render(<ModuleGrid modules={modules} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('module-card-lis'));

    expect(setSelectedModuleMock).toHaveBeenCalledWith('lis');
    expect(onSelect).toHaveBeenCalledWith('lis');
    expect(navigateMock).toHaveBeenCalledWith({ to: '/lis/dashboard' });
  });

  it('renders an empty grid when the user has no modules', () => {
    render(<ModuleGrid modules={[]} />);
    expect(screen.queryByTestId('module-grid')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^module-card-/)).toHaveLength(0);
  });
});
