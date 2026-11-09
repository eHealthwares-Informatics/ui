import { Stack } from '@mantine/core';
import { memo } from 'react';
import { TabGroup } from '@/features/rxsoft/types';
import { FieldGroup } from './FieldGroup';

function TabPanelComponent({
  tab,
  formState,
  updateField,
}: {
  tab: TabGroup;
  formState: Record<string, unknown>;
  updateField: (name: string, value: unknown) => void;
}) {
  return (
    <>
      {tab.render ? (
        tab.render({ formState, updateField })
      ) : (
        <Stack gap="xl">
          {tab.fieldGroups?.map((fieldGroup, index) => (
            <FieldGroup
              index={index}
              fieldGroup={fieldGroup}
              formState={formState}
              updateField={updateField}
            />
          ))}
        </Stack>
      )}
    </>
  );
}

export const TabPanel = memo(TabPanelComponent);
