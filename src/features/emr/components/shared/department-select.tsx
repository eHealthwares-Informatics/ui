import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { emrApi } from '@/lib/emr-api';
import type { Department } from '../../lib/emr-types';

/** Value stored in a `department` form field. */
export type DepartmentOption = {
  id: string;
  code: string;
  name: string;
  departmentType: string;
};

export function toDepartmentOption(department: Department): DepartmentOption {
  return {
    id: department.id,
    code: department.code,
    name: department.name,
    departmentType: department.departmentType,
  };
}

export function departmentDisplayName(department: DepartmentOption): string {
  return `${department.code} · ${department.name}`.trim();
}

/**
 * Departments of the signed-in user's site. Departments belong to an identity
 * location (`department.locationId`), so scoping the list by the caller's
 * location keeps the picker to the facilities they work in.
 */
export function useDepartmentsForLocation(locationId?: string | null): {
  departments: Department[];
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['emr', 'departments', 'for-location', locationId ?? 'all'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Department[] }>('/departments', {
        params: {
          limit: 200,
          isActive: 'true',
          locationId: locationId ?? undefined,
        },
      });
      return res.data?.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
  const departments = useMemo(() => data ?? [], [data]);
  return { departments, isLoading };
}

export function DepartmentSelect({
  value,
  onChange,
  departments,
  label = 'Department',
  required = false,
  error,
  placeholder = 'Select a department',
}: {
  value: DepartmentOption | null;
  onChange: (department: DepartmentOption | null) => void;
  departments: Department[];
  label?: string;
  required?: boolean;
  error?: React.ReactNode;
  placeholder?: string;
}) {
  const options = useMemo(
    () =>
      departments.map((department) => ({
        value: department.id,
        label: departmentDisplayName(toDepartmentOption(department)),
      })),
    [departments]
  );

  return (
    <Select
      label={label}
      required={required}
      error={error}
      placeholder={placeholder}
      searchable
      clearable
      nothingFoundMessage="No departments found"
      data={options}
      value={value?.id ?? null}
      onChange={(id) => {
        const department = departments.find((entry) => entry.id === id);
        onChange(department ? toDepartmentOption(department) : null);
      }}
    />
  );
}
