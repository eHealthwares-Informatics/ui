import { Accordion, Badge, Card, Group, Stack, Table, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { lisApi } from '@/lib/lis-api';
import { useOrderContext } from '../OrderContext';

interface TestDefinition {
  id: string;
  code: string;
  name: string;
}

export function OrderSummarySection() {
  const { state } = useOrderContext();
  const [tests, setTests] = useState<TestDefinition[]>([]);

  useEffect(() => {
    lisApi.get('/lis/test-definitions', { params: { limit: 200 } }).then((res) => {
      setTests(res.data?.data ?? []);
    });
  }, []);

  const getTestName = (id: string) => tests.find((t) => t.id === t.id)?.name ?? id;

  return (
    <Card withBorder p="md" radius="md">
      <Text fw={600} mb="sm">
        Order Summary
      </Text>

      <Accordion defaultValue="patient">
        <Accordion.Item value="patient">
          <Accordion.Control>
            <Text size="sm" fw={500}>
              Patient Information
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="xs">
              <Text size="sm">
                <strong>Name:</strong> {state.patientName}
              </Text>
              <Text size="sm">
                <strong>MRN:</strong> {state.patientId}
              </Text>
              <Text size="sm">
                <strong>Gender:</strong> {state.patientGender ?? '—'}
              </Text>
              <Text size="sm">
                <strong>DOB:</strong> {state.patientDateOfBirth ?? '—'}
              </Text>
              <Text size="sm">
                <strong>Age:</strong> {state.patientAge ?? '—'}
              </Text>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="tests">
          <Accordion.Control>
            <Text size="sm" fw={500}>
              Ordered Tests ({state.items.length})
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="xs">
              {state.items.map((item) => (
                <Group key={item.testDefinitionId} justify="space-between">
                  <Text size="sm">{getTestName(item.testDefinitionId)}</Text>
                  {(() => {
                    const assignment = state.assignments.find((a) => a.testDefinitionId === item.testDefinitionId);
                    return assignment ? (
                      <Badge size="sm" color="violet" variant="light">
                        Sample #{assignment.sampleIndex + 1}
                      </Badge>
                    ) : (
                      <Badge size="sm" color="gray" variant="light">
                        Unassigned
                      </Badge>
                    );
                  })()}
                </Group>
              ))}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="samples">
          <Accordion.Control>
            <Text size="sm" fw={500}>
              Samples ({state.samples.length})
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="xs">
              {state.samples.map((s, i) => (
                <Group key={i} justify="space-between">
                  <Text size="sm">
                    Sample #{i + 1}: {s.barcode}
                  </Text>
                  <Badge size="sm" color="blue" variant="light">
                    {s.sampleType ?? '—'}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="order">
          <Accordion.Control>
            <Text size="sm" fw={500}>
              Order Details
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="xs">
              <Text size="sm">
                <strong>Order #:</strong> {state.orderNumber ?? '—'}
              </Text>
              <Text size="sm">
                <strong>Priority:</strong> {state.priorityId ?? '—'}
              </Text>
              <Text size="sm">
                <strong>Requester:</strong> {state.requesterName ?? '—'}
              </Text>
              <Text size="sm">
                <strong>Diagnosis:</strong> {state.diagnosis ?? '—'}
              </Text>
              <Text size="sm">
                <strong>Notes:</strong> {state.notes ?? '—'}
              </Text>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Card>
  );
}
