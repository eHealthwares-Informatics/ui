import {
  Tabs,
  Card,
  Textarea,
  Button,
  Text,
  Group,
  Stack,
  Title,
  Paper,
  FileInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { FileUp, Upload } from 'lucide-react';
import { useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

const codeSample = JSON.stringify(
  [
    {
      module: 'LOINC',
      code: '1234-5',
      shortName: 'CBC',
      fullName: 'Complete Blood Count',
      shortDescription: 'Sample concept code',
      fullDescription: 'Example payload for bulk code upload',
    },
  ],
  null,
  2
);

const conceptValueSample = JSON.stringify(
  [
    {
      entity: 'concept-uuid',
      module: 'LOINC',
      attributeId: 'specimen',
      attributeName: 'Specimen',
      value: 'Blood',
      valueFormat: 'text',
    },
  ],
  null,
  2
);

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsText(file);
  });
}

export function CodingConceptUploadPage() {
  const [codesPayload, setCodesPayload] = useState(codeSample);
  const [valuesPayload, setValuesPayload] = useState(conceptValueSample);

  const codesUpload = useMutation({
    mutationFn: async () => {
      const parsed = JSON.parse(codesPayload);
      const res = await codingConceptApi.post('/concepts/upload/codes', parsed);
      return res.data;
    },
    onSuccess: () => notifications.show({ message: 'Concept codes uploaded', color: 'green' }),
    onError: (error: any) =>
      notifications.show({
        color: 'red',
        message: getApiErrorMessage(error),
      }),
  });

  const valuesUpload = useMutation({
    mutationFn: async () => {
      const parsed = JSON.parse(valuesPayload);
      const res = await codingConceptApi.post('/concepts/upload/values', parsed);
      return res.data;
    },
    onSuccess: () => notifications.show({ message: 'Concept values uploaded', color: 'green' }),
    onError: (error: any) =>
      notifications.show({
        color: 'red',
        message: getApiErrorMessage(error),
      }),
  });

  return (
    <RxPage
      title="Coding Concept Upload"
      description="Bulk upload codes and concept values into the terminology registry using JSON arrays."
    >
      <Tabs defaultValue="codes">
        <Tabs.List>
          <Tabs.Tab value="codes">Codes upload</Tabs.Tab>
          <Tabs.Tab value="values">Concept values upload</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="codes" pt="md">
          <UploadPanel
            title="Bulk Upload Codes"
            description="Paste a JSON array of module codes or load it from a file, then submit it directly."
            value={codesPayload}
            sample={codeSample}
            onChange={setCodesPayload}
            onSubmit={() => codesUpload.mutate()}
            isPending={codesUpload.isPending}
          />
        </Tabs.Panel>

        <Tabs.Panel value="values" pt="md">
          <UploadPanel
            title="Bulk Upload Concept Values"
            description="Paste a JSON array of concept value records keyed by concept entity UUID."
            value={valuesPayload}
            sample={conceptValueSample}
            onChange={setValuesPayload}
            onSubmit={() => valuesUpload.mutate()}
            isPending={valuesUpload.isPending}
          />
        </Tabs.Panel>
      </Tabs>
    </RxPage>
  );
}

function UploadPanel({
  title,
  description,
  value,
  sample,
  onChange,
  onSubmit,
  isPending,
}: {
  title: string;
  description: string;
  value: string;
  sample: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <div>
          <Title order={4}>{title}</Title>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </div>

        <Group>
          <Button
            variant="light"
            leftSection={<FileUp size={16} />}
            onClick={() => onChange(sample)}
          >
            Load sample
          </Button>

          <FileInput
            accept="application/json,.json"
            leftSection={<Upload size={16} />}
            placeholder="Load file"
            onChange={async (file) => {
              if (!file) {return;}
              const contents = await readFile(file);
              onChange(contents);
            }}
          />
        </Group>

        <Textarea
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          minRows={14}
          autosize
          styles={{ input: { fontFamily: 'monospace', fontSize: 13 } }}
        />

        <Button onClick={onSubmit} loading={isPending}>
          Upload payload
        </Button>
      </Stack>
    </Card>
  );
}
