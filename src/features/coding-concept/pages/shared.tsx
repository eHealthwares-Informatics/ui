import { Badge, Card, Group, Stack, Text } from '@mantine/core';

export const codingModuleOptions = [
  { label: 'DICOM', value: 'DICOM' },
  { label: 'LOINC', value: 'LOINC' },
  { label: 'SNOMED', value: 'SNOMED' },
  { label: 'EMDEx', value: 'EMDEx' },
  { label: 'ICD10', value: 'ICD10' },
  { label: 'ICD11', value: 'ICD11' },
  { label: 'CPT', value: 'CPT' },
  { label: 'RxNorm', value: 'RxNorm' },
];

export const codingModuleLabel = (module?: string | null): string => {
  switch (module) {
    case 'ICD10':
      return 'ICD-10';
    case 'ICD11':
      return 'ICD-11';
    case 'CPT':
      return 'CPT';
    case 'LOINC':
      return 'LOINC';
    case 'SNOMED':
      return 'SNOMED';
    case 'DICOM':
      return 'DICOM';
    case 'EMDEx':
      return 'EMDEx';
    case 'RxNorm':
      return 'RxNorm';
    default:
      return 'Code';
  }
};

type MetadataItem = {
  attributeId: string;
  attributeName: string;
  attributeValue: string;
  valueFormat?: string;
};

export function MetadataPreview({ metadata }: { metadata?: Record<string, MetadataItem> }) {
  const entries = Object.entries(metadata ?? {});

  if (!entries.length) {
    return (
      <Text size="sm" c="dimmed">
        No metadata returned for this concept.
      </Text>
    );
  }

  return (
    <Group align="stretch" grow>
      {entries.map(([key, value]) => (
        <Card key={key} withBorder radius="md" style={{ borderStyle: 'dashed' }}>
          <Stack gap={6}>
            <Group justify="space-between">
              <Text size="sm" fw={600}>
                {value.attributeName}
              </Text>

              <Badge variant="outline">{value.attributeId}</Badge>
            </Group>

            <Text size="sm" fw={500} style={{ wordBreak: 'break-word' }}>
              {value.attributeValue}
            </Text>

            <Text size="xs" c="dimmed">
              Format: {value.valueFormat ?? 'plain'}
            </Text>
          </Stack>
        </Card>
      ))}
    </Group>
  );
}

type Concept = {
  fullName?: string;
  shortName?: string;
  code?: string;
  module?: string;
  shortDescription?: string;
  fullDescription?: string;
  externalMappings?: Array<{
    id?: string;
    externalModule: string;
    externalCode: string;
    internalModule: string;
    internalCode?: string;
  }>;
};

export function ConceptSummaryCard({ concept }: { concept?: Concept | null }) {
  if (!concept) {return null;}

  const title = concept.fullName ?? concept.shortName ?? concept.code ?? 'Unknown concept';

  return (
    <Card withBorder radius="md">
      <Stack gap="sm">
        {/* Header */}
        <Group>
          <Text fw={700} size="lg">
            {title}
          </Text>

          {concept.module && <Badge>{concept.module}</Badge>}

          {concept.code && <Badge variant="outline">{concept.code}</Badge>}
        </Group>

        {/* Description */}
        <Text size="sm" c="dimmed">
          {concept.shortDescription ?? concept.fullDescription ?? 'No description available.'}
        </Text>

        {/* External mappings */}
        {!!concept.externalMappings?.length && (
          <Stack gap={6}>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed">
              External mappings
            </Text>

            {concept.externalMappings.map((mapping, idx) => (
              <Card
                key={mapping.id ?? `${mapping.externalModule}-${mapping.externalCode}-${idx}`}
                withBorder
                radius="sm"
                p="xs"
              >
                <Text size="xs">
                  {mapping.externalModule}:{mapping.externalCode} → {mapping.internalModule}:
                  {mapping.internalCode ?? concept.code}
                </Text>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
