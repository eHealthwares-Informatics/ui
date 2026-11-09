import { Stack, Button, Group, Text, ActionIcon } from '@mantine/core';
import { Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { RenderField } from '@/components/form/RenderField';

const conditionOperators = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'regex', label: 'Regex' },
  { value: 'in', label: 'In' },
  { value: 'between', label: 'Between' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'lt', label: 'Less Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lte', label: 'Less Than or Equal' },
];

export function ConditionsTab({ formState, updateField }: { formState: any; updateField: any }) {
  const conditions = formState.conditions || [];

  const addCondition = () => {
    const newCondition = {
      field: '',
      operator: 'equals',
      value: '',
    };
    updateField('conditions', [...conditions, newCondition]);
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    updateField('conditions', updated);
  };

  const removeCondition = (index: number) => {
    const updated = conditions.filter((_: any, i: number) => i !== index);
    updateField('conditions', updated);
  };

  return (
    <Stack gap="md" py="md">
      <Group justify="space-between">
        <Text size="sm" fw={500}>
          Routing Conditions
        </Text>
        <Button variant="outline" leftSection={<Plus size={16} />} onClick={addCondition} size="sm">
          Add Condition
        </Button>
      </Group>

      {conditions.map((condition: any, index: number) => (
        <Group key={index} align="flex-start" gap="md">
          <div style={{ flex: 1 }}>
            <RenderField
              field={{
                name: `condition-${index}-field`,
                label: 'Field',
                placeholder: 'e.g., messageType',
              }}
              value={condition.field || ''}
              updateField={(_, value) => updateCondition(index, 'field', value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <RenderField
              field={{
                name: `condition-${index}-operator`,
                label: 'Operator',
                type: 'select',
                options: conditionOperators,
              }}
              value={condition.operator || 'equals'}
              updateField={(_, value) => updateCondition(index, 'operator', value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <RenderField
              field={{
                name: `condition-${index}-value`,
                label: 'Value',
                placeholder: 'condition value',
              }}
              value={condition.value || ''}
              updateField={(_, value) => updateCondition(index, 'value', value)}
            />
          </div>
          <ActionIcon color="red" variant="light" onClick={() => removeCondition(index)} mt="xl">
            <Trash size={16} />
          </ActionIcon>
        </Group>
      ))}

      {conditions.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No conditions defined. Messages will match this route if no conditions are set.
        </Text>
      )}
    </Stack>
  );
}
