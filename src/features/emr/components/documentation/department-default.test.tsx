import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@test-utils';
import { vi } from 'vitest';
import { DynamicFormFields } from './dynamic-form';

/**
 * Department defaults: the control lists the departments of the signed-in
 * user's site and preselects the current staff member's department.
 */
const get = vi.fn();

vi.mock('@/lib/emr-api', () => ({
  emrApi: { get: (...args: unknown[]) => get(...args) },
}));

function staffRecord(departmentId: string | null) {
  return {
    id: 'staff-1',
    staffNumber: 'STF-001',
    firstName: 'Ada',
    lastName: 'Obi',
    otherNames: null,
    email: null,
    phone: null,
    hireDate: null,
    roleType: 'Doctor',
    category: null,
    department: null,
    departmentId,
    identityLocationId: null,
    userId: 'user-1',
    isActive: true,
    otherDetails: null,
  };
}

const opd = {
  id: 'dept-opd',
  organizationId: null,
  locationId: 'loc-1',
  code: 'OPD',
  name: 'Outpatients',
  departmentType: 'OPD',
  description: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const lab = {
  ...opd,
  id: 'dept-lab',
  code: 'LAB',
  name: 'Laboratory',
  departmentType: 'LABORATORY',
};

const schema = {
  fields: [{ key: 'departmentId', label: 'Department', type: 'department' as const }],
};

function renderForm(
  value: Record<string, unknown>,
  runtime: Record<string, unknown> = { userId: 'user-1', locationId: 'loc-1' }
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onChange = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <DynamicFormFields schema={schema} value={value} onChange={onChange} runtime={runtime} />
    </QueryClientProvider>
  );
  return onChange;
}

describe('department field defaults', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("preselects the current staff member's department", async () => {
    get.mockImplementation(async (url: string) =>
      url === '/staff'
        ? { data: { data: [staffRecord('dept-opd')] } }
        : { data: { data: [opd, lab] } }
    );

    const onChange = renderForm({});

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        departmentId: {
          id: 'dept-opd',
          code: 'OPD',
          name: 'Outpatients',
          departmentType: 'OPD',
        },
      })
    );
    expect(get).toHaveBeenCalledWith('/departments', {
      params: { limit: 200, isActive: 'true', locationId: 'loc-1' },
    });
  });

  it('does not pick a department when the staff member has none', async () => {
    get.mockImplementation(async (url: string) =>
      url === '/staff' ? { data: { data: [staffRecord(null)] } } : { data: { data: [opd, lab] } }
    );

    const onChange = renderForm({});

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('falls back to the only department of the site', async () => {
    get.mockImplementation(async (url: string) =>
      url === '/staff' ? { data: { data: [] } } : { data: { data: [opd] } }
    );

    const onChange = renderForm({});

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        departmentId: {
          id: 'dept-opd',
          code: 'OPD',
          name: 'Outpatients',
          departmentType: 'OPD',
        },
      })
    );
  });

  it('keeps an existing department when amending', async () => {
    get.mockImplementation(async (url: string) =>
      url === '/staff'
        ? { data: { data: [staffRecord('dept-opd')] } }
        : { data: { data: [opd, lab] } }
    );

    const onChange = renderForm({
      departmentId: {
        id: 'dept-lab',
        code: 'LAB',
        name: 'Laboratory',
        departmentType: 'LABORATORY',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onChange).not.toHaveBeenCalled();
  });
});
