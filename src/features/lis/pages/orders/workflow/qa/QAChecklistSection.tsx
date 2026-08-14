import { useState } from 'react';
import { Card, Stack, Text, Checkbox, Paper, Group, Badge } from '@mantine/core';
import { useOrderContext } from '../OrderContext';

const DEFAULT_CHECKS = [
  { key: 'patient_verified', label: 'Patient identity verified' },
  { key: 'samples_collected', label: 'All samples collected correctly' },
  { key: 'tests_assigned', label: 'All tests assigned to samples' },
  { key: 'labels_printed', label: 'Labels printed and affixed' },
  { key: 'storage_assigned', label: 'Storage locations assigned' },
  { key: 'consent_obtained', label: 'Consent obtained (if required)' },
  { key: 'requester_verified', label: 'Requester information complete' },
  { key: 'clinical_info', label: 'Clinical information recorded' },
];

export function QAChecklistSection() {
  const { state } = useOrderContext();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = DEFAULT_CHECKS.every((c) => checked[c.key]);
  const completedCount = Object.values(checked).filter(Boolean).length;

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>QA Checklist</Text>
          <Badge color={allChecked ? 'green' : 'yellow'} variant="light">
            {completedCount}/{DEFAULT_CHECKS.length}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed">
          Verify each item before finalizing the order.
        </Text>

        <Paper withBorder p="sm">
          <Stack gap="xs">
            {DEFAULT_CHECKS.map((c) => (
              <Checkbox
                key={c.key}
                label={c.label}
                checked={checked[c.key] ?? false}
                onChange={(e) => setChecked((prev) => ({ ...prev, [c.key]: e.currentTarget.checked }))}
              />
            ))}
          </Stack>
        </Paper>

        {allChecked && (
          <Badge color="green" variant="light" size="lg">
            All checks passed
          </Badge>
        )}
      </Stack>
    </Card>
  );
}
