import { Alert, Stack, Button, Group, Grid } from '@mantine/core';
import { AlertCircle, Code, FormInput } from 'lucide-react';
import { useState } from 'react';
import { JsonEditorField } from '@/components/form/json-editor-field';
import { RenderField } from '@/components/form/RenderField';
import { attributesFieldGroups } from './tabs';

export function AttributesTab({ formState, updateField }: { formState: any; updateField: any }) {
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
          label="Custom Attributes (JSON)"
          value={formState.attributes}
          onChange={(v) => updateField('attributes', v as Record<string, unknown>)}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="md" py="md">
      <Alert icon={<AlertCircle size={16} />} title="Custom Attributes" color="blue">
        Define custom attributes for this Application Entity
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

      {attributesFieldGroups.map((group, groupIndex) => (
        <Grid key={groupIndex}>
          {group.fields.map((field) => (
            <Grid.Col key={field.name} span={field.col || 12}>
              <RenderField
                field={field}
                value={
                  field.name.startsWith('attributes.')
                    ? (formState.attributes || {})[
                        field.name.split('.')[1] as keyof typeof formState.attributes
                      ]
                    : ''
                }
                updateField={(name, value) => {
                  if (name.startsWith('attributes.')) {
                    const key = name.split('.')[1];
                    updateField('attributes', {
                      ...formState.attributes,
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
