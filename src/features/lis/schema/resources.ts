import { Column, Field, FieldGroup, Option, TabGroup } from '@/features/rxsoft/types';

export type LisResourceConfig = {
  key: string;
  title: string;
  description: string;
  endpoint: string;
  columns: Column[];
  tabGroups?: TabGroup[];
  createFields?: Field[];
  createFieldGroups?: FieldGroup[];
};

const createSelectionFields = ({
  name,
  label,
  endpoint,
  valueKey = 'id',
  labelKey = 'name',
  col = 6,
}: {
  name: string;
  label: string;
  endpoint: string;
  valueKey?: string;
  labelKey?: string;
  col: number;
}) => ({
  name,
  label,
  type: 'select' as const,
  endpoint,
  valueKey,
  labelKey,
  placeholder: `Select ${label.toLowerCase()}`,
  col,
});

export const lisResources: LisResourceConfig[] = [
  {
    key: 'test-definitions',
    title: 'Test Definitions',
    description: 'Test catalog, LOINC links, sample types, reporting and turnaround rules.',
    endpoint: '/lis/test-definitions',

    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'resultType', label: 'Result Type' },
      { key: 'active', label: 'Active' },
    ],

    tabGroups: [
      {
        title: 'General',
        value: 'general',
        fieldGroups: [
          {
            title: 'Basic Information',
            fields: [
              {
                name: 'code',
                label: 'Code',
                type: 'text',
                placeholder: 'ABC123',
                col: 4,
              },

              {
                name: 'loincId',
                label: 'LOINC',
                searchParam: {
                  endpoint: '/lis/loinc',
                  valueKey: 'id',
                  labelKey: 'code',
                },
                col: 5,
                type: 'async-select',
              },
              {
                name: 'name',
                label: 'Name',
                type: 'text',
                placeholder: 'Complete blood count',
                required: true,
                col: 6,
              },

              {
                name: 'methodology',
                label: 'Methodology',
                type: 'text',
                col: 6,
              },

              {
                name: 'description',
                label: 'Description',
                type: 'text',
                col: 12,
              },

              {
                name: 'categoryId',
                label: 'Category',

                col: 4,
                type: 'async-select',
                searchParam: {
                  endpoint: '/lis/test-categories',
                },
              },

              {
                name: 'resultType',
                label: 'Result Type',
                type: 'select',
                col: 3,
                options: [
                  { label: 'NUMERIC', value: 'NUMERIC' },
                  { label: 'TEXT', value: 'TEXT' },
                  { label: 'DICTIONARY', value: 'DICTIONARY' },
                  { label: 'BOOLEAN', value: 'BOOLEAN' },
                  { label: 'DATE', value: 'DATE' },
                  { label: 'RICH_TEXT', value: 'RICH_TEXT' },
                  { label: 'ATTACHMENT', value: 'ATTACHMENT' },
                  { label: 'TABLE', value: 'TABLE' },
                  { label: 'CALCULATED', value: 'CALCULATED' },
                ],
              },
              {
                name: 'uomId',
                label: 'Unit',
                searchParam: {
                  endpoint: '/lis/uoms',
                },
                col: 4,
                type: 'async-select',
              },
            ],
          },
        ],
      },

      {
        title: 'Workflow & Assignment',
        value: 'workflow',
        fieldGroups: [
          {
            title: 'Assignments',
            fields: [
              {
                name: 'sampleTypeIds',
                label: 'Sample Types',
                type: 'multi-async-select',
                searchParam: {
                  endpoint: '/lis/sample-types',
                  valueKey: 'id',
                  labelKey: 'name',
                },
                placeholder: `Select Sample Types`,
                col: 6,
              },

              {
                name: 'programIds',
                label: 'Programs',
                type: 'multi-async-select',
                searchParam: {
                  endpoint: '/lis/programs',
                  valueKey: 'id',
                  labelKey: 'name',
                },
                placeholder: `Select Programs`,
                col: 6,
              },
            ],
          },

          {
            title: 'Processing Rules',
            fields: [
              {
                name: 'turnaroundTimeMinutes',
                label: 'Turnaround Minutes',
                type: 'number',
                col: 5,
              },

              {
                name: 'testDurationMinutes',
                label: 'Test Duration Minutes',
                type: 'number',
                col: 5,
              },

              {
                name: 'reportable',
                label: 'Reportable',
                type: 'switch',
                col: 4,
              },

              {
                name: 'active',
                label: 'Active',
                type: 'switch',
                col: 4,
              },
            ],
          },
        ],
      },

      {
        title: 'Reference Limits',
        value: 'referenceLimits',
        fieldGroups: [
          {
            title: 'Reference & Critical Values',
            fields: [
              {
                name: 'minValue',
                label: 'Min Value',
                type: 'number',
                col: 3,
              },
              {
                name: 'maxValue',
                label: 'Max Value',
                type: 'number',
                col: 3,
              },
              {
                name: 'criticalMin',
                label: 'Critical Min',
                type: 'number',
                col: 3,
              },
              {
                name: 'criticalMax',
                label: 'Critical Max',
                type: 'number',
                col: 3,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    key: 'reference-ranges',
    title: 'Reference Ranges',
    description: 'Age, gender, operator and critical range definitions.',
    endpoint: '/lis/reference-ranges',

    columns: [
      { key: 'test', label: 'Test', render: (row: any) => row.test?.name },
      { key: 'gender', label: 'Gender' },
      { key: 'minAge', label: 'Min Age' },
      { key: 'maxAge', label: 'Max Age' },
      { key: 'lowValue', label: 'Low' },
      { key: 'highValue', label: 'High' },
    ],

    createFieldGroups: [
      {
        title: 'Criteria',
        fields: [
          {
            name: 'testId',
            label: 'Test',
            searchParam: {
              endpoint: '/lis/test-definitions',
            },
            type: 'async-select',
            placeholder: `Select Test`,
            col: 6,
          },

          {
            name: 'gender',
            label: 'Gender',
            type: 'select',
            col: 3,
            options: [
              { label: 'DEFAULT', value: 'DEFAULT' },
              { label: 'MALE', value: 'MALE' },
              { label: 'FEMALE', value: 'FEMALE' },
            ] as Option[],
          },

          {
            name: 'minAge',
            label: 'Min Age',
            type: 'number',
            required: false,
            col: 3,
          },

          {
            name: 'maxAge',
            label: 'Max Age',
            type: 'number',
            required: false,
            col: 3,
          },
          {
            name: 'unitId',
            label: 'Unit',
            searchParam: {
              endpoint: '/lis/uoms',
            },
            type: 'async-select',
            placeholder: `Select UoM`,
            col: 6,
          },
        ],
      },

      {
        title: 'Values',
        fields: [
          {
            name: 'operator',
            label: 'Operator',
            type: 'select',
            col: 3,
            options: [
              { label: 'BETWEEN', value: 'BETWEEN' },
              { label: 'LESS_THAN', value: 'LESS_THAN' },
              {
                label: 'LESS_THAN_OR_EQUAL',
                value: 'LESS_THAN_OR_EQUAL',
              },
              { label: 'GREATER_THAN', value: 'GREATER_THAN' },
              {
                label: 'GREATER_THAN_OR_EQUAL',
                value: 'GREATER_THAN_OR_EQUAL',
              },
              { label: 'EQUALS', value: 'EQUALS' },
            ] as Option[],
          },
          {
            name: 'lowValue',
            label: 'Value',
            type: 'number',
            required: true,
            col: 3,
          },

          {
            name: 'highValue',
            label: 'Value To',
            type: 'number',
            required: true,
            col: 3,
          },

          {
            name: 'criticalLow',
            label: 'Critical Low',
            type: 'number',
            col: 3,
          },

          {
            name: 'criticalHigh',
            label: 'Critical High',
            type: 'number',
            col: 3,
          },

          {
            name: 'active',
            label: 'Active',
            type: 'switch',
            col: 2,
          },
        ],
      },
    ],
  },

  {
    key: 'rejection-reasons',
    title: 'Rejection Reasons',
    description: 'Reusable reasons for rejecting samples.',
    endpoint: '/lis/rejection-reasons',

    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'active', label: 'Active' },
    ],

    createFieldGroups: [
      {
        title: 'Details',
        fields: [
          {
            name: 'code',
            label: 'Code',
            type: 'text',
            col: 4,
          },

          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            col: 8,
          },

          {
            name: 'description',
            label: 'Description',
            type: 'text',
            col: 12,
          },

          {
            name: 'active',
            label: 'Active',
            type: 'switch',
            col: 3,
          },
        ],
      },
    ],
  },

  {
    key: 'programs',
    title: 'Programs',
    description: 'Laboratory programs and their test definitions.',
    endpoint: '/lis/programs',

    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'active', label: 'Active' },
    ],

    tabGroups: [
      {
        title: 'Program',
        value: 'program',
        fieldGroups: [
          {
            title: 'Program Details',
            fields: [
              {
                name: 'code',
                label: 'Code',
                type: 'text',
                col: 4,
              },

              {
                name: 'name',
                label: 'Name',
                type: 'text',
                required: true,
                col: 8,
              },

              {
                name: 'description',
                label: 'Description',
                type: 'text',
                col: 12,
              },

              {
                name: 'active',
                label: 'Active',
                type: 'switch',
                col: 3,
              },
            ],
          },
        ],
      },

      {
        title: 'Assignments',
        value: 'assignments',
        fieldGroups: [
          {
            title: 'Test Definitions',
            fields: [
              {
                name: 'testDefinitionIds',
                label: 'Test Definitions',
                searchParam: {
                  endpoint: '/lis/test-definitions',
                  valueKey: 'id',
                  labelKey: 'name',
                },
                type: 'multi-async-select',
                placeholder: `Select Test Definitions`,
                col: 12,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    key: 'location-types',
    title: 'Location Types',
    description: 'Allowed storage and facility hierarchy definitions.',
    endpoint: '/lis/location-types',

    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'active', label: 'Active' },
    ],

    tabGroups: [
      {
        title: 'General',
        value: 'general',
        fieldGroups: [
          {
            title: 'Basic Information',
            fields: [
              {
                name: 'code',
                label: 'Code',
                type: 'text',
                col: 4,
              },

              {
                name: 'name',
                label: 'Name',
                type: 'text',
                required: true,
                col: 8,
              },

              {
                name: 'description',
                label: 'Description',
                type: 'text',
                col: 12,
              },

              {
                name: 'active',
                label: 'Active',
                type: 'switch',
                col: 3,
              },
            ],
          },
        ],
      },

      {
        title: 'Hierarchy Rules',
        value: 'hierarchyRules',
        fieldGroups: [
          {
            title: 'Child Rules',
            fields: [
              {
                name: 'allowChildren',
                label: 'Allow Children',
                type: 'switch',
                col: 4,
              },
              {
                name: 'allowedChildTypeIds',
                label: 'Allowed Child Types',
                type: 'multi-async-select',
                searchParam: {
                  endpoint: '/lis/location-types',
                  valueKey: 'id',
                  labelKey: 'name',
                },
                placeholder: `Select Allowed Child Types`,
                col: 6,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    key: 'locations',
    title: 'Locations',
    description: 'Physical laboratory, storage and freezer locations.',
    endpoint: '/lis/locations',

    columns: [
      { key: 'reference', label: 'Reference' },
      { key: 'name', label: 'Name' },
      { key: 'type.name', label: 'Type' },
      { key: 'parent', label: 'Parent' },
      { key: 'storageAssignment', label: 'Storage Assignment' },
      { key: 'active', label: 'Active' },
    ],

    createFieldGroups: [
      {
        title: 'Location Details',
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            col: 6,
          },

          {
            name: 'reference',
            label: 'Reference',
            type: 'text',
            col: 6,
          },

          {
            name: 'typeId',
            label: 'Type',
            searchParam: {
              endpoint: '/lis/location-types',
            },
            type: 'async-select',
            placeholder: `Select Type`,
            col: 6,
          },

          {
            name: 'parentId',
            label: 'Parent',
            searchParam: {
              endpoint: '/lis/locations',
            },
            type: 'async-select',
            placeholder: `Select Parent`,
            col: 6,
          },

          {
            name: 'storageAssignment',
            label: 'Storage Assignment',
            type: 'switch',
            col: 3,
          },

          {
            name: 'active',
            label: 'Active',
            type: 'switch',
            col: 3,
          },
        ],
      },
    ],
  },

  {
    key: 'attribute-definitions',
    title: 'Attributes',
    description: 'Dynamic location attributes such as freezer connection settings.',
    endpoint: '/lis/attribute-definitions',

    columns: [
      { key: 'key', label: 'Key' },
      { key: 'name', label: 'Name' },
      { key: 'dataType', label: 'Type' },
      { key: 'appliesToType', label: 'Location Type' },
      { key: 'active', label: 'Active' },
    ],

    tabGroups: [
      {
        title: 'Definition',
        value: 'definition',
        fieldGroups: [
          {
            title: 'Attribute Details',
            fields: [
              {
                name: 'key',
                label: 'Key',
                type: 'text',
                col: 4,
              },

              {
                name: 'name',
                label: 'Name',
                type: 'text',
                required: true,
                col: 8,
              },

              {
                name: 'description',
                label: 'Description',
                type: 'text',
                col: 12,
              },

              createSelectionFields({
                name: 'appliesToTypeId',
                label: 'Location Type',
                endpoint: '/lis/location-types',
                col: 6,
              }),

              {
                name: 'dataType',
                label: 'Data Type',
                type: 'select',
                col: 6,
                options: [
                  { label: 'TEXT', value: 'TEXT' },
                  { label: 'NUMBER', value: 'NUMBER' },
                  { label: 'BOOLEAN', value: 'BOOLEAN' },
                  { label: 'DATE', value: 'DATE' },
                ] as Option[],
              },
            ],
          },
        ],
      },

      {
        title: 'Validation',
        value: 'validation',
        fieldGroups: [
          {
            title: 'Validation Rules',
            fields: [
              {
                name: 'required',
                label: 'Required',
                type: 'switch',
                col: 3,
              },

              {
                name: 'active',
                label: 'Active',
                type: 'switch',
                col: 3,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    key: 'sample-types',
    title: 'Sample Types',
    description: 'Sample type master data and accession code fragments.',
    endpoint: '/lis/sample-types',

    columns: [
      { key: 'key', label: 'Key' },
      { key: 'name', label: 'Name' },
      { key: 'accessionCode', label: 'Accession' },
      { key: 'active', label: 'Active' },
    ],

    createFieldGroups: [
      {
        title: 'Sample Type Details',
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            col: 6,
          },

          {
            name: 'key',
            label: 'Key',
            type: 'text',
            col: 3,
          },

          {
            name: 'accessionCode',
            label: 'Accession Code',
            type: 'text',
            required: true,
            col: 3,
          },

          {
            name: 'description',
            label: 'Description',
            type: 'text',
            col: 12,
          },

          {
            name: 'active',
            label: 'Active',
            type: 'switch',
            col: 3,
          },
        ],
      },
    ],
  },

  {
    key: 'priorities',
    title: 'Priorities',
    description: 'Routine, urgent and STAT processing priorities.',
    endpoint: '/lis/priorities',

    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'index', label: 'Index' },
      { key: 'active', label: 'Active' },
    ],

    createFields: [
      {
        name: 'code',
        label: 'Code',
        type: 'text',
        col: 4,
      },

      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        col: 6,
      },

      {
        name: 'index',
        label: 'Index',
        type: 'number',
        col: 2,
      },

      {
        name: 'active',
        label: 'Active',
        type: 'switch',
        col: 3,
      },
    ],
  },

  {
    key: 'test-categories',
    title: 'Test Categories',
    description: 'Test grouping and report categories.',
    endpoint: '/lis/test-categories',

    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'active', label: 'Active' },
    ],

    createFieldGroups: [
      {
        title: 'Category Details',
        fields: [
          {
            name: 'code',
            label: 'Code',
            type: 'text',
            col: 4,
          },

          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            col: 8,
          },

          {
            name: 'description',
            label: 'Description',
            type: 'text',
            col: 12,
          },

          {
            name: 'active',
            label: 'Active',
            type: 'switch',
            col: 3,
          },
        ],
      },
    ],
  },

  {
    key: 'uoms',
    title: 'Units of Measurement',
    description: 'Units of measure for test results and reference ranges.',
    endpoint: '/lis/uoms',

    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'active', label: 'Active' },
    ],

    createFieldGroups: [
      {
        title: 'Unit Details',
        fields: [
          {
            name: 'code',
            label: 'Code',
            type: 'text',
            col: 4,
          },

          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            col: 8,
          },

          {
            name: 'description',
            label: 'Description',
            type: 'text',
            col: 12,
          },

          {
            name: 'active',
            label: 'Active',
            type: 'switch',
            col: 3,
          },
        ],
      },
    ],
  },

  {
    key: 'loinc',
    title: 'LOINC',
    description: 'Seeded and local LOINC test codes.',
    endpoint: '/lis/loinc',

    columns: [
      { key: 'code', label: 'Code' },
      { key: 'component', label: 'Component' },
      { key: 'property', label: 'Property' },
      { key: 'scale', label: 'Scale' },
    ],

    tabGroups: [
      {
        title: 'LOINC Details',
        value: 'loincDetails',
        fieldGroups: [
          {
            title: 'Core Information',
            fields: [
              {
                name: 'code',
                label: 'Code',
                type: 'text',
                required: true,
                col: 4,
              },

              {
                name: 'component',
                label: 'Component',
                type: 'text',
                col: 8,
              },

              {
                name: 'property',
                label: 'Property',
                type: 'text',
                col: 4,
              },

              {
                name: 'system',
                label: 'System',
                type: 'text',
                col: 4,
              },

              {
                name: 'scale',
                label: 'Scale',
                type: 'text',
                col: 4,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    key: 'test-sections',
    title: 'Test Sections',
    description: 'Lab department/section groupings for organizing tests.',
    endpoint: '/lis/test-sections',

    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'sortOrder', label: 'Sort Order' },
      { key: 'active', label: 'Active' },
    ],

    createFieldGroups: [
      {
        title: 'Section Details',
        fields: [
          {
            name: 'code',
            label: 'Code',
            type: 'text',
            col: 4,
          },

          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            col: 8,
          },

          {
            name: 'sortOrder',
            label: 'Sort Order',
            type: 'number',
            col: 3,
          },

          {
            name: 'description',
            label: 'Description',
            type: 'text',
            col: 12,
          },

          {
            name: 'active',
            label: 'Active',
            type: 'switch',
            col: 3,
          },
        ],
      },
    ],
  },

  {
    key: 'methods',
    title: 'Methods',
    description: 'Test methodologies and analytical procedures.',
    endpoint: '/lis/methods',

    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'active', label: 'Active' },
    ],

    createFieldGroups: [
      {
        title: 'Method Details',
        fields: [
          {
            name: 'code',
            label: 'Code',
            type: 'text',
            col: 4,
          },

          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            col: 8,
          },

          {
            name: 'description',
            label: 'Description',
            type: 'text',
            col: 12,
          },

          {
            name: 'active',
            label: 'Active',
            type: 'switch',
            col: 3,
          },
        ],
      },
    ],
  },

  {
    key: 'panels',
    title: 'Panels',
    description: 'Test panels containing multiple test definitions.',
    endpoint: '/lis/panels',

    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
    ],

    createFieldGroups: [
      {
        title: 'Panel Details',
        fields: [
          {
            name: 'code',
            label: 'Code',
            type: 'text',
            col: 4,
          },

          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            col: 8,
          },

          {
            name: 'description',
            label: 'Description',
            type: 'text',
            col: 12,
          },
        ],
      },
    ],
  },

  {
    key: 'patients',
    title: 'Patients',
    description: 'Patient demographic records and medical record numbers.',
    endpoint: '/lis/patients',

    columns: [
      { key: 'patientId', label: 'MRN' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'gender', label: 'Gender' },
      { key: 'dateOfBirth', label: 'DOB' },
    ],

    createFieldGroups: [
      {
        title: 'Patient Details',
        fields: [
          {
            name: 'patientId',
            label: 'MRN',
            type: 'text',
            required: true,
            col: 4,
          },

          {
            name: 'firstName',
            label: 'First Name',
            type: 'text',
            required: true,
            col: 4,
          },

          {
            name: 'lastName',
            label: 'Last Name',
            type: 'text',
            required: true,
            col: 4,
          },

          {
            name: 'dateOfBirth',
            label: 'Date of Birth',
            type: 'text',
            col: 3,
          },

          {
            name: 'gender',
            label: 'Gender',
            type: 'select',
            col: 3,
            options: [
              { label: 'Male', value: 'MALE' },
              { label: 'Female', value: 'FEMALE' },
              { label: 'Other', value: 'OTHER' },
              { label: 'Unknown', value: 'UNKNOWN' },
            ] as Option[],
          },

          {
            name: 'phone',
            label: 'Phone',
            type: 'text',
            col: 6,
          },

          {
            name: 'email',
            label: 'Email',
            type: 'text',
            col: 6,
          },

          {
            name: 'address',
            label: 'Address',
            type: 'text',
            col: 12,
          },
        ],
      },
    ],
  },

  {
    key: 'orders',
    title: 'Orders',
    description: 'Lab orders/accessions with patient and test item assignments.',
    endpoint: '/lis/orders',

    columns: [
      { key: 'orderNumber', label: 'Order #' },
      {
        key: 'patient',
        label: 'Patient',
        render: (row: any) => `${row.patient?.firstName} ${row.patient?.lastName}`,
      },
      { key: 'status', label: 'Status' },
      { key: 'requestedDate', label: 'Requested' },
    ],
  },

  {
    key: 'results',
    title: 'Results',
    description: 'Test result values entered against order items.',
    endpoint: '/lis/results',

    columns: [
      { key: 'orderItemId', label: 'Order Item' },
      { key: 'value', label: 'Value' },
      { key: 'enteredDate', label: 'Entered Date' },
      { key: 'validatedDate', label: 'Validated Date' },
    ],
  },
];

export function getLisResourceByKey(key: string) {
  return lisResources.find((resource) => resource.key === key);
}
