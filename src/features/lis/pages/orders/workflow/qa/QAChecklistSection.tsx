import { Card, Stack, Text, Checkbox, Paper, Group, Badge, Loader, Alert } from '@mantine/core';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { lisApi } from '@/lib/lis-api';
import { useOrderContext } from '../OrderContext';

interface QaChecklistItem {
  id: string;
  code: string;
  name: string;
  category: string;
  required: boolean;
}

export function QAChecklistSection() {
  const { state, dispatch } = useOrderContext();
  const [items, setItems] = useState<QaChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lisApi
      .get('/lis/qa-checklist-items', { params: { limit: 200 } })
      .then((res) => {
        setItems(res.data?.data ?? []);
      })
      .catch((err) => {
        setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load QA checklist');
      })
      .finally(() => setLoading(false));
  }, []);

  const allChecked = items.length > 0 && items.every((c) => state.qaChecks[c.code] ?? false);
  const completedCount = items.filter((c) => state.qaChecks[c.code] ?? false).length;

  const toggle = (code: string, value: boolean) => {
    dispatch({ type: 'SET_QA_CHECKS', payload: { ...state.qaChecks, [code]: value } });
  };

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>QA Checklist</Text>
          {!loading && items.length > 0 && (
            <Badge color={allChecked ? 'green' : 'yellow'} variant="light">
              {completedCount}/{items.length}
            </Badge>
          )}
        </Group>

        <Text size="sm" c="dimmed">
          Verify each item before finalizing the order.
        </Text>

        {error && (
          <Alert icon={<AlertCircle size={16} />} title="Error" color="red" variant="light">
            {error}
          </Alert>
        )}

        {loading ? (
          <Loader size="sm" />
        ) : (
          <Paper withBorder p="sm">
            <Stack gap="xs">
              {items.map((c) => (
                <Checkbox
                  key={c.code}
                  label={c.name}
                  checked={state.qaChecks[c.code] ?? false}
                  onChange={(e) => toggle(c.code, e.currentTarget.checked)}
                />
              ))}
            </Stack>
          </Paper>
        )}

        {!loading && items.length === 0 && !error && (
          <Text size="sm" c="dimmed">
            No QA checklist items configured.
          </Text>
        )}

        {allChecked && (
          <Badge color="green" variant="light" size="lg">
            All checks passed
          </Badge>
        )}
      </Stack>
    </Card>
  );
}
