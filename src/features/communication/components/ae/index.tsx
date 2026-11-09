import { useState } from 'react';
import { createFormContext } from '@/components/form/form-provider';
import { DataPageShell } from '@/components/page/data-page-shell';
import { TabGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { AttributesTab } from './attributes-tab';
import { columns } from './config';
import { GeneralTab } from './general-tab';
import { InboundTab } from './inbound-tab';
import { OutboundTab } from './outbound-tab';
import { SecurityTab } from './security-tab';
import { AEFormState, defaultFormState } from './types';

export const { Provider: FormProvider, useForm } = createFormContext(defaultFormState);

export function ApplicationEntitiesPage() {
  const [formState, setFormState] = useState<AEFormState>(defaultFormState);
  const updateField = (name: string, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const tabGroups: TabGroup[] = [
    {
      value: 'general',
      title: 'General',
      render: () => <GeneralTab formState={formState} updateField={updateField} />,
    },
    {
      value: 'inbound',
      title: 'Inbound Config',
      render: () => <InboundTab formState={formState} updateField={updateField} />,
      fields: [],
    },
    {
      value: 'outbound',
      title: 'Outbound Config',
      render: () => <OutboundTab formState={formState} updateField={updateField} />,
    },
    {
      value: 'security',
      title: 'Security',
      render: () => <SecurityTab formState={formState} updateField={updateField} />,
    },
    {
      value: 'attributes',
      title: 'Attributes',
      fields: [
        {
          label: 'Custom Attributes',
          name: 'attributes',
          type: 'json',
        },
      ],
      render: () => <AttributesTab formState={formState} updateField={updateField} />,
    },
  ];

  const config: ModelConfig = {
    id: 'ae',
    title: 'Application Entity',
    description: 'Registered codes by coding module.',
    endpoint: 'v1/aes',
    columns,
    modalTitle: 'Application Entity',
    tabGroups,
    defaultState: defaultFormState,
    buildCreatePayload: (values) => ({
      code: {
        module: values.module,
        code: values.code,
        shortName: values.shortName,
        fullName: values.fullName,
        shortDescription: values.shortDescription,
        fullDescription: values.fullDescription,
      },
    }),
    buildUpdatePayload: (values) => ({
      module: values.module,
      code: values.code,
      shortName: values.shortName,
      fullName: values.fullName,
      shortDescription: values.shortDescription,
      fullDescription: values.fullDescription,
    }),
    canDelete: true,
  };

  return (
    <DataPageShell
      config={config}
      embedded
      formState={formState}
      setFormState={setFormState as (state: Record<string, unknown>) => void}
      updateField={updateField as (name: string, value: unknown) => void}
    />
  );
}
