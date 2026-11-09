import { Alert, Stack, Button, Group, Grid } from '@mantine/core';
import { AlertCircle, Code, FormInput } from 'lucide-react';
import { useState } from 'react';
import { JsonEditorField } from '@/components/form/json-editor-field';
import { RenderField } from '@/components/form/RenderField';
import { useForm } from '.';
import { outboundFieldGroups } from './tabs';
import { ProtocolConfig } from './types';

export function OutboundTab({ formState, updateField }: { formState: any; updateField: any }) {
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
          label="Outbound Configuration (JSON)"
          value={formState.outboundConfig}
          onChange={(v) => updateField('outboundConfig', v as ProtocolConfig[])}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="md" py="md">
      <Alert icon={<AlertCircle size={16} />} title="Outbound Configuration" color="blue">
        Configure how this AE sends data to external systems
      </Alert>

      <Group justify="space-between">
        <Button
          variant="outline"
          leftSection={<Code size={16} />}
          onClick={() => setViewMode('json')}
        >
          JSON View
        </Button>
      </Group>

      {outboundFieldGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {group.title && <h4>{group.title}</h4>}
          <Grid>
            {group.fields.map((field) => (
              <Grid.Col key={field.name} span={field.col || 12}>
                <RenderField
                  field={field}
                  value={field.name === 'outboundConfig' ? formState.outboundConfig : ''}
                  updateField={updateField}
                />
              </Grid.Col>
            ))}
          </Grid>
        </div>
      ))}
    </Stack>
  );
}
