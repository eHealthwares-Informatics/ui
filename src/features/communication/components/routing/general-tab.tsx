import { Stack, Button, Group } from '@mantine/core';
import { Code, FormInput } from 'lucide-react';
import { useState } from 'react';
import { JsonEditorField } from '@/components/form/json-editor-field';
import { RenderField } from '@/components/form/RenderField';
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
        <div key={groupIndex}>
          {group.fields.map((field) => (
            <div key={field.name} style={{ marginBottom: '1rem' }}>
              <RenderField
                field={field}
                value={formState[field.name] || ''}
                updateField={updateField}
              />
            </div>
          ))}
        </div>
      ))}
    </Stack>
  );
}
