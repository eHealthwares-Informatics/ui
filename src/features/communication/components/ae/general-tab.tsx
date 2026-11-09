import { Badge, Grid, Group, Stack, Button, ActionIcon } from '@mantine/core';
import { Code, FormInput } from 'lucide-react';
import { useState } from 'react';
import { JsonEditorField } from '@/components/form/json-editor-field';
import { RenderField } from '@/components/form/RenderField';
import { PROTOCOL_TYPE_OPTIONS } from '../../types/constants';
import { LabelField } from '../shared';
import { generalFieldGroups } from './tabs';

export function GeneralTab({ formState, updateField }: { formState: any; updateField: any }) {
  const [viewMode, setViewMode] = useState<'form' | 'json'>('form');

  if (viewMode === 'json') {
    return (
      <Stack gap="md" py="md">
        <Group justify="space-between">
          <Button
            variant="outline"
            leftSection={<FormInput size={16} />}
            onClick={() => setViewMode('form')}
          >
            Form View
          </Button>
        </Group>
        <JsonEditorField
          label="General Configuration (JSON)"
          value={formState}
          onChange={(v) => {
            // Update form state from JSON
            Object.entries(v as Record<string, any>).forEach(([key, value]) => {
              updateField(key as any, value);
            });
          }}
        />
      </Stack>
    );
  }
  return (
    <Stack gap="md" py="md">
      <Group justify="space-between">
        <Button
          variant="outline"
          leftSection={<Code size={16} />}
          onClick={() => setViewMode('json')}
        >
          JSON View
        </Button>
      </Group>

      {generalFieldGroups.map((group, groupIndex) => (
        <Grid key={groupIndex}>
          {group.fields.map((field) => (
            <Grid.Col key={field.name} span={field.col || 12}>
              <RenderField
                field={field}
                value={formState[field.name] || ''}
                updateField={updateField}
                disabled={field.disabled}
              />
            </Grid.Col>
          ))}
        </Grid>
      ))}

      <RenderField
        field={{
          name: 'inboundCapabilities',
          label: 'Inbound',
          type: 'multi-pick',
          options: PROTOCOL_TYPE_OPTIONS,
          placeholder: 'Add outbound protocol',
        }}
        value={formState.inboundCapabilities}
        updateField={updateField}
        disabled={false}
      />
      <RenderField
        field={{
          name: 'outboundCapabilities',
          label: 'Outbound',
          type: 'multi-pick',
          options: PROTOCOL_TYPE_OPTIONS,
          placeholder: 'Add outbound protocol',
        }}
        value={formState.outboundCapabilities}
        updateField={updateField}
        disabled={false}
      />
    </Stack>
  );
}
