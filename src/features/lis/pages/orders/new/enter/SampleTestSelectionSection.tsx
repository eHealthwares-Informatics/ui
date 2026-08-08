import { useState, useEffect } from 'react';
import { Card, Stack, Text, Checkbox, Group, TextInput, Badge, Paper, Table } from '@mantine/core';
import { Search } from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import { lisApi } from '@/lib/lis-api';
import { useOrderContext } from '../OrderContext';

interface TestDefinition {
  id: string;
  code: string;
  name: string;
  resultType: string;
  active: boolean;
}

interface Panel {
  id: string;
  code: string;
  name: string;
  description: string | null;
  panelItems: Array<{ id: string; test: { id: string } }>;
}

export function SampleTestSelectionSection() {
  const { state, dispatch } = useOrderContext();
  const [tests, setTests] = useState<TestDefinition[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(testSearch, 300);

  useEffect(() => {
    lisApi.get('/lis/test-definitions', { params: { limit: 100 } }).then((res) => {
      const all = (res.data?.data ?? []).filter((t: TestDefinition) => t.active !== false);
      setTests(all);
    });
    lisApi.get('/lis/panels', { params: { limit: 100 } }).then((res) => {
      setPanels(res.data?.data ?? []);
    });
  }, []);

  const selectedIds = new Set(state.items.map((i) => i.testDefinitionId));

  const filteredTests = [...tests]
    .sort((a, b) => Number(selectedIds.has(b.id)) - Number(selectedIds.has(a.id)))
    .filter(
      (t) =>
        selectedIds.has(t.id) ||
        !debouncedSearch ||
        t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.code.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

  const toggleTest = (testId: string) => {
    if (selectedIds.has(testId)) {
      dispatch({ type: 'SET_ITEMS', payload: state.items.filter((i) => i.testDefinitionId !== testId) });
    } else {
      dispatch({ type: 'SET_ITEMS', payload: [...state.items, { testDefinitionId: testId }] });
    }
  };

  const togglePanel = (panel: Panel) => {
    const panelTestIds = panel.panelItems?.map((pi) => pi.test?.id).filter(Boolean) ?? [];
    const allSelected = panelTestIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      dispatch({ type: 'SET_ITEMS', payload: state.items.filter((i) => !panelTestIds.includes(i.testDefinitionId)) });
    } else {
      const existing = new Set(state.items.map((i) => i.testDefinitionId));
      const toAdd = panelTestIds.filter((id) => !existing.has(id));
      dispatch({ type: 'SET_ITEMS', payload: [...state.items, ...toAdd.map((id) => ({ testDefinitionId: id }))] });
    }
  };

  const selectedCount = state.items.length;

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Tests & Panels</Text>
          <Badge color="violet" variant="light">
            {selectedCount} selected
          </Badge>
        </Group>

        <TextInput
          placeholder="Search tests..."
          value={testSearch}
          onChange={(e) => setTestSearch(e.currentTarget.value)}
          leftSection={<Search size={16} />}
        />

        {panels.length > 0 && (
          <>
            <Text size="sm" fw={500} c="dimmed">
              Panels
            </Text>
            <Paper withBorder>
              {panels.map((panel) => {
                const panelTestIds = panel.panelItems?.map((pi) => pi.test?.id).filter(Boolean) ?? [];
                const allSelected = panelTestIds.length > 0 && panelTestIds.every((id) => selectedIds.has(id));
                return (
                  <Group key={panel.id} p="xs" justify="space-between">
                    <Checkbox
                      label={<Text size="sm">{panel.name}</Text>}
                      checked={allSelected}
                      indeterminate={panelTestIds.some((id) => selectedIds.has(id)) && !allSelected}
                      onChange={() => togglePanel(panel)}
                    />
                    <Badge size="sm" color="gray">
                      {panelTestIds.length} tests
                    </Badge>
                  </Group>
                );
              })}
            </Paper>
          </>
        )}

        <Text size="sm" fw={500} c="dimmed" mt="xs">
          Individual Tests
        </Text>
        <Paper withBorder style={{ height: 320, overflow: 'auto' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ position: 'sticky', top: 0, background: 'var(--mantine-color-body)', zIndex: 1 }}>
              <Table.Tr>
                <Table.Th>Select</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Result Type</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTests.map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td>
                    <Checkbox checked={selectedIds.has(t.id)} onChange={() => toggleTest(t.id)} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{t.code}</Text>
                  </Table.Td>
                  <Table.Td>{t.name}</Table.Td>
                  <Table.Td>
                    <Badge size="sm" color="gray" variant="light">
                      {t.resultType}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </Card>
  );
}
