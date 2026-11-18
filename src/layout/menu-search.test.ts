import { describe, expect, it } from 'vitest';
import { filterNavGroupsBySearch } from './menu-search';
import type { NavItem } from './types';

const groups: NavItem[] = [
  {
    title: 'EMR',
    items: [
      { title: 'Patients', url: '/emr/patients' },
      { title: 'Appointments', url: '/emr/appointments' },
    ],
  },
  {
    title: 'Maternity',
    items: [
      { title: 'Antenatal', url: '/emr/features/1' },
      { title: 'Postnatal', url: '/emr/features/2' },
    ],
  },
  {
    title: 'Wards',
    items: [{ title: 'Beds', url: '/emr/wards/beds' }],
  },
];

describe('filterNavGroupsBySearch', () => {
  it('returns the original groups for an empty/blank query', () => {
    expect(filterNavGroupsBySearch(groups, '')).toBe(groups);
    expect(filterNavGroupsBySearch(groups, '   ')).toBe(groups);
  });

  it('keeps only the matching child and its group', () => {
    const result = filterNavGroupsBySearch(groups, 'antenatal');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Maternity');
    expect(result[0].items?.map((item) => item.title)).toEqual(['Antenatal']);
  });

  it('keeps all children when the group title matches', () => {
    const result = filterNavGroupsBySearch(groups, 'maternity');
    expect(result).toHaveLength(1);
    expect(result[0].items?.map((item) => item.title)).toEqual(['Antenatal', 'Postnatal']);
  });

  it('is case-insensitive', () => {
    const result = filterNavGroupsBySearch(groups, 'BEDS');
    expect(result[0].title).toBe('Wards');
  });

  it('returns nothing when no menu matches', () => {
    expect(filterNavGroupsBySearch(groups, 'not-a-menu')).toEqual([]);
  });
});
