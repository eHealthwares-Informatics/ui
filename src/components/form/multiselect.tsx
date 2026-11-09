import { Button, Checkbox, Group, Popover, Text } from '@mantine/core';
import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Option } from '@/features/rxsoft/types';

type MultiSelectFieldProps = {
  value: Option[];
  options: Option[];
  onChange: (value: Option[]) => void;
  placeholder: string;
  triggerClassName?: string;
  disabled?: boolean;
  error?: string;
};

export function MultiSelectField({
  value,
  options,
  onChange,
  placeholder,
  error,
}: MultiSelectFieldProps) {
  const [opened, setOpened] = useState(false);

  const toggleValue = (val: Option) => {
    const index = value.findIndex((v) => v.value === val.value);
    if (index >= 0) {
      onChange(value.splice(index, 1)); //remove
    } else {
      onChange([...value, val]); //add
    }
  };

  const selectedLabels = options
    .filter((o) => value.filter((v) => o.value === v.value))
    .map((o) => o.label);

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-start" width="target">
      <Popover.Target>
        <Button
          variant="default"
          onClick={() => setOpened((o) => !o)}
          rightSection={<ChevronsUpDown size={16} />}
          styles={{
            root: {
              justifyContent: 'space-between',
            },
          }}
        >
          <Text size="sm" c={selectedLabels.length ? 'black' : 'dimmed'}>
            {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
          </Text>
        </Button>
      </Popover.Target>

      <Popover.Dropdown>
        <Group gap="xs">
          {options.map((option) => (
            <Checkbox
              key={option.value}
              label={option.label}
              checked={Boolean(value.find((v) => v.value === option.value))}
              onChange={() => toggleValue(option)}
            />
          ))}
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
}
