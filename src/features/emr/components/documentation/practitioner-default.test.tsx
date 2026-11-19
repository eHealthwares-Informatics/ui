import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@test-utils';
import { vi } from 'vitest';
import { DynamicFormFields } from './dynamic-form';

/**
 * Practitioner defaults: the control preselects the staff record linked to the
 * signed-in identity user (`staff.userId`) so the clinician capturing a form
 * does not have to pick themselves.
 */
const get = vi.fn();

vi.mock('@/lib/emr-api', () => ({
  emrApi: { get: (...args: unknown[]) => get(...args) },
}));

const staff = {
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
  departmentId: null,
  identityLocationId: null,
  userId: 'user-1',
  isActive: true,
  otherDetails: null,
};

const schema = {
  fields: [
    {
      key: 'practitionerId',
      label: 'Practitioner',
      type: 'practitioner' as const,
      required: true,
    },
  ],
};

function renderForm(value: Record<string, unknown>, onChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <DynamicFormFields
        schema={schema}
        value={value}
        onChange={onChange}
        runtime={{ userId: 'user-1' }}
      />
    </QueryClientProvider>
  );
  return onChange;
}

describe('practitioner field defaults', () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({ data: { data: [staff] } });
  });

  it('preselects the staff record of the signed-in user', async () => {
    const onChange = renderForm({});

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        practitionerId: {
          id: 'staff-1',
          staffId: 'STF-001',
          staffName: 'Ada Obi',
          roleType: 'Doctor',
        },
      })
    );
    expect(get).toHaveBeenCalledWith('/staff', {
      params: { userId: 'user-1', limit: 1, isActive: 'true' },
    });
  });

  it('keeps an existing practitioner when amending', async () => {
    const onChange = renderForm({
      practitionerId: {
        id: 'staff-9',
        staffId: 'STF-009',
        staffName: 'Grace Bello',
        roleType: 'Nurse',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not default while a public token form is being filled', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const onChange = vi.fn();
    render(
      <QueryClientProvider client={client}>
        <DynamicFormFields
          schema={schema}
          value={{}}
          onChange={onChange}
          runtime={{ publicToken: 'tok-1', userId: 'user-1' }}
        />
      </QueryClientProvider>
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(get).not.toHaveBeenCalledWith('/staff', {
      params: expect.objectContaining({ userId: 'user-1' }),
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
