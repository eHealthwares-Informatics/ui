import 'reactflow/dist/style.css';
import { Card, Text, Stack, Group, Badge, Button, ScrollArea, Divider } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Handle, Position } from 'reactflow';
import { RxPage } from '@/components/page/rx-page';
import { communicationApi } from '@/lib/communication-api';

type FlowTopology = {
  applicationEntities?: any[];
  routingTables?: any[];
  validationRules?: any[];
};

const sampleTopology: FlowTopology = {
  applicationEntities: [
    {
      id: 'switch',
      name: 'Switch',
      facilityName: 'RxSoft Switch Facility',
      inboundCapabilities: ['HL7_V2', 'FHIR_R4', 'CUSTOM_JSON'],
      outboundCapabilities: ['HL7_V2', 'FHIR_R4', 'CUSTOM_JSON'],
    },
    {
      id: 'healthstack',
      name: 'Healthstack',
      facilityName: 'Healthstack Hospital',
      inboundCapabilities: ['HL7_V2', 'FHIR_R4'],
      outboundCapabilities: ['HL7_V2', 'FHIR_R4'],
    },
    {
      id: 'dcm4chee',
      name: 'DCM4CHEE',
      facilityName: 'Radiology',
      inboundCapabilities: ['HL7_V2'],
      outboundCapabilities: ['HL7_V2'],
    },
    {
      id: 'openelis',
      name: 'OpenELIS',
      facilityName: 'Lab',
      inboundCapabilities: ['FHIR_R4'],
      outboundCapabilities: ['FHIR_R4'],
    },
  ],
  routingTables: [
    {
      id: 'default',
      routes: [
        {
          name: 'Healthstack → DCM4CHEE',
          sourceAE: 'healthstack',
          targetAE: 'dcm4chee',
          protocol: 'HL7_V2',
        },
        {
          name: 'Healthstack → OpenELIS',
          sourceAE: 'healthstack',
          targetAE: 'openelis',
          protocol: 'FHIR_R4',
        },
      ],
    },
  ],
  validationRules: [
    { id: 'v1', name: 'DICOM Validation', action: { module: 'DICOM' } },
    { id: 'v2', name: 'LOINC Validation', action: { module: 'LOINC' } },
  ],
};

/* -------------------- Custom Node -------------------- */
function AENode({ data }: any) {
  return (
    <Card shadow="sm" padding="sm" radius="md" withBorder style={{ minWidth: 180 }}>
      <Text fw={600} size="sm">
        {data.name}
      </Text>

      <Text size="xs" c="dimmed">
        {data.facilityName}
      </Text>

      <Divider my={6} />

      <Group gap={6}>
        {data.protocols?.map((p: string) => (
          <Badge key={p} size="xs" variant="light">
            {p}
          </Badge>
        ))}
      </Group>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}

/* -------------------- Page -------------------- */
export function GraphViewPage() {
  const { data, isLoading, isError } = useQuery<FlowTopology>({
    queryKey: ['communication', 'flow', 'topology'],
    queryFn: async () => {
      const res = await communicationApi.get('/flow/topology');
      return res.data;
    },
    retry: false,
  });

  const topology = useMemo(() => data ?? sampleTopology, [data]);

  /* -------------------- Convert to Graph -------------------- */
  const nodes = useMemo(() => {
    return (
      topology.applicationEntities?.map((ae, index) => ({
        id: ae.id,
        position: { x: index * 250, y: 150 },
        data: {
          name: ae.name,
          facilityName: ae.facilityName,
          protocols: ae.inboundCapabilities,
        },
        type: 'ae',
      })) ?? []
    );
  }, [topology]);

  const edges = useMemo(() => {
    const routes = topology.routingTables?.[0]?.routes ?? [];

    return routes.map((r: any) => ({
      id: r.name,
      source: r.sourceAE,
      target: r.targetAE,
      label: r.protocol,
      animated: true,
    }));
  }, [topology]);

  return (
    <RxPage
      title="Flow Graph"
      description="Visualize switch topology and routing relationships"
      actions={<Button onClick={() => window.location.reload()}>Refresh</Button>}
    >
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        {/* ---------------- LEFT PANEL ---------------- */}
        <Stack gap="md">
          <Card withBorder>
            <Text fw={600}>Nodes</Text>
            <ScrollArea h={180}>
              <Stack gap="xs" mt="sm">
                {topology.applicationEntities?.map((n) => (
                  <Card key={n.id} withBorder p="xs">
                    <Text size="sm">{n.name}</Text>
                    <Text size="xs" c="dimmed">
                      {n.id}
                    </Text>
                  </Card>
                ))}
              </Stack>
            </ScrollArea>
          </Card>

          <Card withBorder>
            <Text fw={600}>Routes</Text>
            <Stack gap="xs" mt="sm">
              {topology.routingTables?.[0]?.routes?.map((r: any) => (
                <Card key={r.name} withBorder p="xs">
                  <Text size="sm">{r.name}</Text>
                  <Text size="xs" c="dimmed">
                    {r.sourceAE} → {r.targetAE}
                  </Text>
                </Card>
              ))}
            </Stack>
          </Card>

          <Card withBorder>
            <Text fw={600}>Validations</Text>
            <Stack gap="xs" mt="sm">
              {topology.validationRules?.map((v) => (
                <Card key={v.id} withBorder p="xs">
                  <Text size="sm">{v.name}</Text>
                  <Text size="xs" c="dimmed">
                    {v.action?.module}
                  </Text>
                </Card>
              ))}
            </Stack>
          </Card>
        </Stack>

        {/* ---------------- GRAPH ---------------- */}
        <Card withBorder radius="md" p="sm" style={{ height: 700 }}>
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={{ ae: AENode }} fitView>
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>

          {isLoading && (
            <Text size="sm" c="dimmed">
              Loading topology…
            </Text>
          )}

          {isError && (
            <Text size="sm" c="red">
              Failed to load live topology (showing sample)
            </Text>
          )}
        </Card>
      </div>
    </RxPage>
  );
}
