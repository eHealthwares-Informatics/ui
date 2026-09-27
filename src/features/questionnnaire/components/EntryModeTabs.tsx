import { Tabs } from '@mantine/core';
import type { EntryMode } from '../../../routes/questionnaire/-types';

type Props = {
  value: EntryMode;
  onChange: (v: EntryMode) => void;
};

export function EntryModeTabs({ value, onChange }: Props) {
  return (
    <Tabs
      value={value}
      onChange={(v) => {
        if (v) {
          onChange(v as EntryMode);
        }
      }}
    >
      <Tabs.List grow>
        <Tabs.Tab value="participant-phone">Find by phone</Tabs.Tab>

        <Tabs.Tab value="conversation-id">Conversation ID</Tabs.Tab>

        <Tabs.Tab value="create-new">Create new</Tabs.Tab>
      </Tabs.List>
    </Tabs>
  );
}
