import {
  Button,
  Code,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { getArrayPayload } from '@/components/utils';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useAuthStore } from '@/stores/auth-store';
import {
  buildNotificationDispatchesConfig,
  type DispatchChannelRow,
  type DispatchEventRow,
  type DispatchTemplateRow,
} from './schema';

const EMPTY_CONTEXT = '{\n  \n}';

export function RxNotificationDispatchesPage() {
  const queryClient = useQueryClient();
  const selectedOrganisationId = useAuthStore((state) => state.selectedOrganisationId);
  // The header organisation filter drives the scope for every role; the
  // backend pins non-superadmins to their own organisation.
  const organizationId = selectedOrganisationId ?? null;
  const scopeParams = useMemo<Record<string, string>>(() => {
    const params: Record<string, string> = {};
    if (selectedOrganisationId === null) {
      params.organizationId = 'null';
    } else if (selectedOrganisationId) {
      params.organizationId = selectedOrganisationId;
    }
    return params;
  }, [selectedOrganisationId]);
  const scopeKey =
    selectedOrganisationId === undefined ? 'all' : (selectedOrganisationId ?? 'global');

  const { data: events = [] } = useQuery({
    queryKey: ['notification-dispatches', 'events', scopeKey],
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-events', {
        params: { ...scopeParams },
      });
      return getArrayPayload(data) as DispatchEventRow[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['notification-dispatches', 'templates', scopeKey],
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-templates', {
        params: { ...scopeParams },
      });
      return getArrayPayload(data) as DispatchTemplateRow[];
    },
  });

  const { data: channels = [] } = useQuery({
    queryKey: ['notification-dispatches', 'channels'],
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-channels');
      return getArrayPayload(data) as DispatchChannelRow[];
    },
  });

  const [testRow, setTestRow] = useState<Record<string, unknown> | null>(null);
  const [testContext, setTestContext] = useState(EMPTY_CONTEXT);
  const [testPhone, setTestPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testPrintFormat, setTestPrintFormat] = useState<string>('');
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<unknown>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const testEvent = useMemo(() => {
    if (!testRow) {
      return null;
    }
    const eventId = String(testRow.eventId ?? '');
    return events.find((event) => String(event.id) === eventId) ?? null;
  }, [testRow, events]);

  const openTest = (row: Record<string, unknown>) => {
    setTestRow(row);
    setTestContext(EMPTY_CONTEXT);
    setTestPhone('');
    setTestEmail('');
    setTestPrintFormat('');
    setTestResult(null);
    setTestError(null);
  };

  const submitTest = async () => {
    if (!testRow) {
      return;
    }
    setTestError(null);

    let context: Record<string, unknown>;
    try {
      context = testContext.trim() ? JSON.parse(testContext) : {};
    } catch {
      setTestError('Context must be valid JSON.');
      return;
    }

    if (!testEvent) {
      setTestError('Could not resolve the event key for this dispatch.');
      return;
    }
    if (!testPhone.trim() && !testEmail.trim()) {
      setTestError('Enter a phone or email recipient.');
      return;
    }

    setTestSubmitting(true);
    try {
      const { data } = await conversationApi.post('/notification-dispatch/send', {
        ...(organizationId ? { organizationId } : {}),
        eventKey: testEvent.key,
        recipients: {
          ...(testPhone.trim() ? { phone: testPhone.trim() } : {}),
          ...(testEmail.trim() ? { email: testEmail.trim() } : {}),
        },
        context,
        ...(testPrintFormat ? { printFormat: testPrintFormat } : {}),
      });
      setTestResult(data);
      notifications.show({
        message: `Test dispatched (sent=${data?.sent ?? 0}, failed=${data?.failed ?? 0}, skipped=${data?.skipped ?? 0})`,
        color: data?.sent ? 'green' : 'yellow',
      });
      await queryClient.invalidateQueries({ queryKey: ['notification-delivery'] });
    } catch (error) {
      setTestError(getApiErrorMessage(error));
    } finally {
      setTestSubmitting(false);
    }
  };

  const config = useMemo(
    () =>
      buildNotificationDispatchesConfig({
        organizationId,
        scopeKey,
        scopeParams,
        events,
        templates,
        channels,
        onTest: openTest,
      }),
    [organizationId, scopeKey, scopeParams, events, templates, channels]
  );

  return (
    <Stack gap="lg">
      <DataPageShell key={scopeKey} config={config} />

      <Modal
        opened={Boolean(testRow)}
        onClose={() => setTestRow(null)}
        title={`Test dispatch${testEvent ? ` — ${testEvent.label || testEvent.key}` : ''}`}
        centered
        size="lg"
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Sends the event through its configured dispatch rules. Conversation renders the template
            bodies (including A4/POS print bodies) and records the delivery.
          </Text>

          <TextInput label="Event key" value={testEvent?.key ?? ''} readOnly ff="monospace" />

          <Group grow>
            <TextInput
              label="Phone"
              placeholder="+2348000000000"
              value={testPhone}
              onChange={(event) => setTestPhone(event.currentTarget.value)}
            />
            <TextInput
              label="Email"
              placeholder="patient@example.com"
              value={testEmail}
              onChange={(event) => setTestEmail(event.currentTarget.value)}
            />
          </Group>

          <Select
            label="Print format"
            description="Leave empty to render every print body on the template."
            data={[
              { value: '', label: 'All print bodies' },
              { value: 'a4_print', label: 'A4 print only' },
              { value: 'pos_print', label: 'POS print only' },
            ]}
            value={testPrintFormat}
            onChange={(value) => setTestPrintFormat(value ?? '')}
            allowDeselect={false}
          />

          <Textarea
            label="Context (JSON)"
            description="Template variables, e.g. patient_name, invoiceNo, itemLines."
            minRows={10}
            autosize
            ff="monospace"
            value={testContext}
            onChange={(event) => setTestContext(event.currentTarget.value)}
          />

          {testError && (
            <Text size="sm" c="red">
              {testError}
            </Text>
          )}

          {testResult != null && (
            <div>
              <Text size="xs" c="dimmed" mb={4}>
                Response
              </Text>
              <Code block style={{ maxHeight: 240, overflow: 'auto' }}>
                {JSON.stringify(testResult, null, 2)}
              </Code>
            </div>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setTestRow(null)}>
              Close
            </Button>
            <Button loading={testSubmitting} onClick={submitTest}>
              Send test
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
