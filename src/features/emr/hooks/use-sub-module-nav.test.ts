import type { SubModuleNavigation } from '../lib/emr-types';
import { buildSubModuleNav, canSeeFeature } from './use-sub-module-nav';

const navigation: SubModuleNavigation[] = [
  {
    id: 'sub-1',
    code: 'MATERNITY',
    name: 'Maternity',
    description: null,
    icon: 'Baby',
    sortOrder: 10,
    features: [
      {
        id: 'feature-2',
        code: 'POSTNATAL',
        name: 'Postnatal Encounter',
        description: null,
        formDefinitionId: 'form-2',
        encounterType: 'CONSULTATION',
        roleCodes: ['emr_clinician'],
        sortOrder: 20,
      },
      {
        id: 'feature-1',
        code: 'ANTENATAL',
        name: 'Antenatal Encounter',
        description: null,
        formDefinitionId: 'form-1',
        encounterType: 'ANTENATAL',
        roleCodes: ['emr_clinician'],
        sortOrder: 10,
      },
    ],
  },
  {
    id: 'sub-2',
    code: 'PRIVATE',
    name: 'Private',
    description: null,
    icon: null,
    sortOrder: 20,
    features: [
      {
        id: 'feature-3',
        code: 'ADMIN_ONLY',
        name: 'Admin Only',
        description: null,
        formDefinitionId: 'form-3',
        encounterType: 'CONSULTATION',
        roleCodes: ['emr_admin'],
        sortOrder: 10,
      },
    ],
  },
];

describe('canSeeFeature', () => {
  it('allows features with no role restriction', () => {
    expect(canSeeFeature([], ['auditor'], false)).toBe(true);
  });

  it('requires one of the feature roles', () => {
    expect(canSeeFeature(['emr_clinician'], ['auditor'], false)).toBe(false);
    expect(canSeeFeature(['emr_clinician'], ['emr_clinician'], false)).toBe(true);
  });

  it('always allows super admins', () => {
    expect(canSeeFeature(['emr_admin'], [], true)).toBe(true);
  });
});

describe('buildSubModuleNav', () => {
  it('maps visible features to sidebar items in sort order', () => {
    const groups = buildSubModuleNav(navigation, ['emr_clinician'], false);

    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('Maternity');
    expect(groups[0].items?.map((item) => item.title)).toEqual([
      'Antenatal Encounter',
      'Postnatal Encounter',
    ]);
    expect(groups[0].items?.[0].url).toBe('/emr/features/feature-1');
  });

  it('drops groups with no visible features', () => {
    const groups = buildSubModuleNav(navigation, ['auditor'], false);

    expect(groups).toHaveLength(0);
  });

  it('shows every feature to super admins', () => {
    const groups = buildSubModuleNav(navigation, [], true);

    expect(groups.map((group) => group.title)).toEqual(['Maternity', 'Private']);
  });
});
