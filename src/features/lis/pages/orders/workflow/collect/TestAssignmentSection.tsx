import {
  Card,
  Stack,
  Text,
  Group,
  Badge,
  Table,
  Select,
  Modal,
  Button,
  Paper,
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { lisApi } from '@/lib/lis-api';
import { useOrderContext } from '../OrderContext';

interface TestDefinition {
  id: string;
  code: string;
  name: string;
}

export function TestAssignmentSection() {
  const { state, dispatch } = useOrderContext();
  const [tests, setTests] = useState<TestDefinition[]>([]);

  useEffect(() => {
    lisApi.get('/lis/test-definitions', { params: { limit: 200 } }).then((res) => {
      const all = res.data?.data ?? [];
      setTests(all);
    });
  }, []);

  const assignedMap = new Map(state.assignments.map((a) => [a.testDefinitionId, a]));

  const getTestName = (id: string) => tests.find((t) => t.id === id)?.name ?? id;

  const assignTest = (testDefinitionId: string, sampleIndex: number) => {
    const existing = state.assignments.filter((a) => a.testDefinitionId !== testDefinitionId);
    dispatch({
      type: 'SET_ASSIGNMENTS',
      payload: [
        ...existing,
        {
          testDefinitionId,
          testName: getTestName(testDefinitionId),
          sampleIndex,
        },
      ],
    });
  };

  const unassignTest = (testDefinitionId: string) => {
    dispatch({
      type: 'SET_ASSIGNMENTS',
      payload: state.assignments.filter((a) => a.testDefinitionId !== testDefinitionId),
    });
  };

  const unassignedTests = state.items.filter((item) => !assignedMap.has(item.testDefinitionId));

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Text fw={600}>Test-to-Sample Assignment</Text>
        <Text size="sm" c="dimmed">
          Assign each ordered test to a specific sample tube.
        </Text>

        {state.assignments.length > 0 && (
          <Paper withBorder>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Test</Table.Th>
                  <Table.Th>Assigned Sample</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {state.assignments.map((a) => (
                  <Table.Tr key={a.testDefinitionId}>
                    <Table.Td>{a.testName}</Table.Td>
                    <Table.Td>
                      <Badge color="violet" variant="light">
                        Sample #{a.sampleIndex + 1}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => unassignTest(a.testDefinitionId)}
                      >
                        Remove
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}

        {state.assignments.length === 0 && (
          <Text size="sm" c="dimmed">
            No tests assigned to samples yet.
          </Text>
        )}

        {unassignedTests.length > 0 && (
          <Paper withBorder p="sm" bg="yellow.0">
            <Text size="sm" fw={500} c="dimmed">
              Unassigned Tests ({unassignedTests.length})
            </Text>
            {state.samples.length > 0 ? (
              <Stack gap="xs" mt="xs">
                {unassignedTests.map((item) => (
                  <Group key={item.testDefinitionId} justify="space-between">
                    <Text size="sm">{getTestName(item.testDefinitionId)}</Text>
                    <Select
                      size="xs"
                      placeholder="Assign to sample..."
                      data={state.samples.map((_, i) => ({
                        value: String(i),
                        label: `Sample #${i + 1}`,
                      }))}
                      onChange={(v) => {
                        if (v !== null) assignTest(item.testDefinitionId, Number(v));
                      }}
                      clearable
                    />
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" mt="xs">
                Add samples first to assign tests.
              </Text>
            )}
          </Paper>
        )}
      </Stack>
    </Card>
  );
}
