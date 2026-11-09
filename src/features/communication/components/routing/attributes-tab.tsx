import { Stack } from '@mantine/core';
import { RenderField } from '@/components/form/RenderField';

export function AttributesTab({ formState, updateField }: { formState: any; updateField: any }) {
  return (
    <Stack gap="md" py="md">
      <RenderField
        field={{
          name: 'attributes',
          label: 'Custom Attributes',
          type: 'json',
        }}
        value={formState.attributes || {}}
        updateField={updateField}
      />
    </Stack>
  );
}
