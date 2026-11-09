import { useState } from 'react';
import { createFormContext } from '@/components/form/form-provider';
import { DataPageShell } from '@/components/page/data-page-shell';
import { TabGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { RoutingFormState, defaultRoutingFormState } from '../../types/routing.model';
import { AttributesTab } from './attributes-tab';
import { ConditionsTab } from './conditions-tab';
import { columns } from './config';
import { GeneralTab } from './general-tab';

export const { Provider: FormProvider, useForm } = createFormContext(defaultRoutingFormState);

export function RoutingPage() {
  const [formState, setFormState] = useState<RoutingFormState>(defaultRoutingFormState);
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
      value: 'conditions',
      title: 'Conditions',
      render: () => <ConditionsTab formState={formState} updateField={updateField} />,
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
    id: 'routing',
    title: 'Routing Rules',
    description: 'Configure routing rules for message processing.',
    endpoint: 'v1/routing/tables/default-routing/routes',
    columns,
    modalTitle: 'Routing Rule',
    tabGroups,
    buildCreatePayload: (values) => ({
      name: values.name,
      description: values.description,
      priority: values.priority,
      sourceAE: values.sourceAE,
      targetAE: values.targetAE,
      messageType: values.messageType,
      protocol: values.protocol,
      conditions: values.conditions,
      mappingId: values.mappingId,
      validationIds: values.validationIds,
      validationConfig: values.validationConfig,
      enabled: values.enabled,
      status: values.status,
      attributes: values.attributes,
    }),
    buildUpdatePayload: (values) => ({
      name: values.name,
      description: values.description,
      priority: values.priority,
      sourceAE: values.sourceAE,
      targetAE: values.targetAE,
      messageType: values.messageType,
      protocol: values.protocol,
      conditions: values.conditions,
      mappingId: values.mappingId,
      validationIds: values.validationIds,
      validationConfig: values.validationConfig,
      enabled: values.enabled,
      status: values.status,
      attributes: values.attributes,
    }),
    canDelete: true,
  };

  return (
    <FormProvider>
      <DataPageShell
        config={config}
        embedded
        formState={formState}
        setFormState={setFormState as (state: Record<string, unknown>) => void}
        updateField={updateField as (name: string, value: unknown) => void}
      />
    </FormProvider>
  );
}
