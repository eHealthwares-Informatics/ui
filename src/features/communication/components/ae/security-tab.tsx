import { Alert, Stack, Button, Group, Grid } from '@mantine/core';
import { AlertCircle, Code, FormInput } from 'lucide-react';
import { useState } from 'react';
import { JsonEditorField } from '@/components/form/json-editor-field';
import { RenderField } from '@/components/form/RenderField';
import { useForm } from '.';
import { securityFieldGroups } from './tabs';
import { SecuritySettings } from './types';

export function SecurityTab({ formState, updateField }: { formState: any; updateField: any }) {
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
          label="Security Settings (JSON)"
          value={formState.securitySettings}
          onChange={(v) => updateField('securitySettings', v as SecuritySettings)}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="md" py="md">
      <Alert icon={<AlertCircle size={16} />} title="Security Settings" color="yellow">
        Configure TLS and authentication settings for secure communication
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

      {securityFieldGroups.map((group, groupIndex) => (
        <Grid key={groupIndex}>
          {group.fields.map((field) => (
            <Grid.Col key={field.name} span={field.col || 12}>
              <RenderField
                field={field}
                value={
                  field.name.startsWith('securitySettings.')
                    ? formState.securitySettings[
                        field.name.split('.')[1] as keyof typeof formState.securitySettings
                      ]
                    : ''
                }
                updateField={(name, value) => {
                  if (name.startsWith('securitySettings.')) {
                    const key = name.split('.')[1];
                    updateField('securitySettings', {
                      ...formState.securitySettings,
                      [key]: value,
                    });
                  } else {
                    updateField(name, value);
                  }
                }}
              />
            </Grid.Col>
          ))}
        </Grid>
      ))}
    </Stack>
  );
}
