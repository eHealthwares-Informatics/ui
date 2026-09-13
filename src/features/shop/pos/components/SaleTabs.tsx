import { ActionIcon, Group, Tabs, Text } from '@mantine/core';
import { Plus, X } from 'lucide-react';

interface Props {
  sessions: any[];
  activeSessionId: string;
  onChange: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  stockLocationName?: string;
}

export function SaleTabs({ sessions, activeSessionId, onChange, onAdd, onClose, stockLocationName }: Props) {
  return (
    <Group px="md" py={4} bg="#d9edf5" justify="space-between">
      <Group gap={4}>
        {sessions.map((session) => (
          <Group
            key={session.id}
            gap={4}
            p="xs"
            style={{
              cursor: 'pointer',
              borderRadius: 4,
              background: session.id === activeSessionId ? '#a6d5e5' : 'transparent',
            }}
            onClick={() => onChange(session.id)}
          >
            <Text size="sm" fw={600}>
              {session.saleCode}
            </Text>
            <ActionIcon
              size="xs"
              variant="subtle"
              onClick={(e) => {
                e.stopPropagation();
                onClose(session.id);
              }}
            >
              <X size={12} />
            </ActionIcon>
          </Group>
        ))}
        <ActionIcon size="sm" ml={4} onClick={onAdd}>
          <Plus size={14} />
        </ActionIcon>
      </Group>
      <Group gap="xs">
        {stockLocationName && (
          <Text size="xs" c="dimmed">Loc: {stockLocationName}</Text>
        )}
        <Text size="sm" fw={600}>
          {sessions.find((s) => s.id === activeSessionId)?.customerName || 'Walk-in'} |{' '}
          {sessions.find((s) => s.id === activeSessionId)?.saleCode || 'N/A'}
        </Text>
      </Group>
    </Group>
  );
}
