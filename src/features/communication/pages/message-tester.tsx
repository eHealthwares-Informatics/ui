import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Textarea, Card, Stack, Group, Text, Grid, ScrollArea, Code } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { AsyncSelectField } from '@/features/components/form/async-field';
import { SelectField } from '@/features/components/form/select';
import { RxPage } from '@/features/components/page/rx-page';
import { communicationApi } from '@/lib/communication-api';
import { getOption } from '../components/shared';

/* ------------------ Schema ------------------ */

const schema = z.object({
  messageType: z.string().min(1, 'Message type is required'),
  messageProtocol: z.string().min(1, 'Message protocol is required'),
  sourceAE: z.string().min(1, 'Source AE is required'),
  targetAE: z.string().min(1, 'Target AE is required'),
  payload: z
    .string()
    .min(1, 'Payload is required')
    .refine((val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    }, 'Payload must be valid JSON'),
});

type FormValues = z.infer<typeof schema>;

/* ------------------ Constants ------------------ */

const messageTypes = [
  { label: 'Order', value: 'ORDER' },
  { label: 'Patient', value: 'PATIENT' },
];

const messageProtocols = [
  { label: 'JSON', value: 'CUSTOM_JSON' },
  { label: 'HL7 V2', value: 'HL7_V2' },
  { label: 'FHIR R4', value: 'FHIR_R4' },
];

/* ------------------ Component ------------------ */

export function MessageTesterPage() {
  const [response, setResponse] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      messageType: '',
      messageProtocol: '',
      sourceAE: '',
      targetAE: '',
      payload: '',
    },
  });

  const messageType = watch('messageType');
  const messageProtocol = watch('messageProtocol');
  const targetAE = watch('targetAE');

  /* ------------------ Sample Payload ------------------ */

  const samplePayload = useMemo(() => {
    if (messageType === 'ORDER' && messageProtocol === 'HL7_V2') {
      return 'MSH|^~\\&|HEALTHSTACK|HS|SWITCH|RXSOFT|202604251200||ORM^O01|123|P|2.5\rPID|1||123456^^^HOSPITAL^MR||Doe^Jane||19840501|F\rORC|NW|ORDER-123|||||R\rOBR|1|ORDER-123||RAD-CHEST^Chest X-Ray^99LOCAL|||202604251200';
    }

    if (messageType === 'ORDER' && messageProtocol === 'FHIR_R4') {
      return 'MSH|^~\\&|HEALTHSTACK|HS|SWITCH|RXSOFT|202604251200||ADT^A04|456|P|2.5\rPID|1||987654^^^HOSPITAL^MR||Smith^John||19780312|M';
    }

    if (messageType === 'ORDER' && messageProtocol === 'CUSTOM_JSON') {
      return JSON.stringify(
        {
          _id: 'order-123',
          documentationId: 'order-123',
          clientId: 'client-123',
          clientname: 'Jane Doe',
          client: { firstname: 'Jane', lastname: 'Doe', dob: '1984-05-01', gender: 'F' },
          order: 'Chest X-Ray',
          order_code: 'RAD-CHEST',
          order_category: 'RADIOLOGY',
          targetAE,
          requestingdoctor_Id: 'doc-001',
          requestingdoctor_facilityname: 'Healthstack Hospital',
        },
        null,
        2
      );
    }

    return JSON.stringify({}, null, 2);
  }, [messageType, messageProtocol, targetAE]);

  /* ------------------ Submit ------------------ */

  const onSubmit = async (data: FormValues) => {
    setIsSending(true);
    setResponse(null);

    try {
      const result = await communicationApi.post('/v1/flow/messages', {
        payload: JSON.parse(data.payload),
        messageType: data.messageType,
        targetAE: data.targetAE,
        sourceAE: data.sourceAE,
      });

      setResponse(JSON.stringify(result.data ?? result, null, 2));
      notifications.show({ message: 'Payload sent successfully' });
    } catch (error) {
      setResponse(String(error));
      notifications.show({ color: 'red', message: 'Failed to send payload' });
    } finally {
      setIsSending(false);
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <RxPage
      title="Message Tester"
      description="Send test HL7 or order model payloads into the switch."
    >
      <Card withBorder radius="md" p="lg">
        <Stack gap="lg">
          <Grid>
            {/* AE */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Controller
                name="sourceAE"
                control={control}
                render={({ field }) => (
                  <AsyncSelectField
                    field={{ label: 'Source AE', name: 'ae', searchParam: { endpoint: '/v1/aes' } }}
                    value={getOption(field.value)}
                    onChange={field.onChange}
                  />
                )}
              />
              <Text c="red" size="xs">
                {errors.sourceAE?.message}
              </Text>

              <Controller
                name="targetAE"
                control={control}
                render={({ field }) => (
                  <AsyncSelectField
                    field={{ label: 'Target AE', name: 'ae', searchParam: { endpoint: '/v1/aes' } }}
                    value={getOption(field.value)}
                    onChange={field.onChange}
                  />
                )}
              />
              <Text c="red" size="xs">
                {errors.targetAE?.message}
              </Text>
            </Grid.Col>

            {/* Message */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Controller
                name="messageType"
                control={control}
                render={({ field }) => (
                  <SelectField
                    label="Message Type"
                    {...field}
                    value={getOption(field.value)}
                    options={messageTypes}
                  />
                )}
              />
              <Text c="red" size="xs">
                {errors.messageType?.message}
              </Text>

              <Controller
                name="messageProtocol"
                control={control}
                render={({ field }) => (
                  <SelectField
                    label="Message Protocol"
                    {...field}
                    value={getOption(field.value)}
                    options={messageProtocols}
                  />
                )}
              />
              <Text c="red" size="xs">
                {errors.messageProtocol?.message}
              </Text>
            </Grid.Col>

            {/* Actions */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Group h="100%" align="flex-end">
                <Button
                  fullWidth
                  variant="light"
                  onClick={() => setValue('payload', samplePayload)}
                >
                  Load Sample Payload
                </Button>
              </Group>
            </Grid.Col>
          </Grid>

          {/* Payload */}
          <Controller
            name="payload"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                autosize
                minRows={10}
                styles={{
                  input: { fontFamily: 'monospace', fontSize: 12 },
                }}
              />
            )}
          />
          <Text c="red" size="xs">
            {errors.payload?.message}
          </Text>

          {/* Submit */}
          <Group justify="flex-end">
            <Button onClick={handleSubmit(onSubmit)} loading={isSending}>
              Send Payload
            </Button>
          </Group>

          {/* Response */}
          {response && (
            <Card withBorder radius="md" p="md" bg="gray.0">
              <Text size="sm" fw={600}>
                Response
              </Text>
              <ScrollArea h={260} mt="sm">
                <Code block>{response}</Code>
              </ScrollArea>
            </Card>
          )}
        </Stack>
      </Card>
    </RxPage>
  );
}
