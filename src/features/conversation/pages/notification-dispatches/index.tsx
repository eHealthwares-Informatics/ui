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
import { useCallback, useMemo, useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { getArrayPayload } from '@/components/utils';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useAuthStore } from '@/stores/auth-store';
import { buildPreview, type NotificationBodies } from './preview';
import { DispatchPreview } from './preview-panel';
import { formatSampleContext, extractTemplateTokens } from './sample-context';
import {
  buildNotificationDispatchesConfig,
  type DispatchChannelRow,
  type DispatchEventRow,
  type DispatchTemplateRow,
} from './schema';

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
  const [testContext, setTestContext] = useState('{}');
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

  // The dispatch's template supplies the sample context the dialog is prefilled
  // with (authored `metadata.options` + any `{{token}}` used by the bodies).
  const testTemplate = useMemo(() => {
    if (!testRow) {
      return null;
    }
    const templateId = String(testRow.templateId ?? '');
    return templates.find((template) => String(template.id) === templateId) ?? null;
  }, [testRow, templates]);

  const testSample = useMemo(() => formatSampleContext(testTemplate), [testTemplate]);
  const testSampleTokens = useMemo(() => extractTemplateTokens(testTemplate), [testTemplate]);

  // The preview needs the authored bodies, which the list payload is not
  // guaranteed to carry — read the template itself once the dialog opens.
  const testTemplateId = testRow ? String(testRow.templateId ?? '') : '';
  const { data: testTemplateBodies, isLoading: testBodiesLoading } = useQuery({
    queryKey: ['notification-dispatches', 'template', testTemplateId, scopeKey],
    enabled: Boolean(testTemplateId),
    queryFn: async () => {
      const { data } = await conversationApi.get(`/notification-templates/${testTemplateId}`, {
        // Only pin a concrete organisation: `null` is the global scope, and the
        // detail endpoint treats a missing param as "no organisation filter".
        params: selectedOrganisationId ? { organizationId: selectedOrganisationId } : {},
      });
      return (data?.bodies ?? null) as NotificationBodies | null;
    },
  });

  // Keep the preview in step with the textarea: only a valid JSON object can be
  // rendered, and an invalid one is reported where the preview would appear.
  const testContextParsed = useMemo<{
    value: Record<string, unknown>;
    error: string | null;
  }>(() => {
    const raw = testContext.trim();
    if (!raw) {
      return { value: {}, error: null };
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { value: parsed as Record<string, unknown>, error: null };
      }
      return { value: {}, error: 'Context must be a JSON object.' };
    } catch (error) {
      return { value: {}, error: (error as Error).message };
    }
  }, [testContext]);

  // Validation runs on the same builder the preview panel renders, so the
  // listed issues match the bodies exactly. Grouped by body so the operator can
  // see which channel copy is short of parameters.
  const testMissingByBody = useMemo(
    () =>
      buildPreview(testTemplateBodies, testContextParsed.value)
        .filter((channel) => channel.missingParams.length > 0)
        .map((channel) => ({ label: channel.label, missing: channel.missingParams })),
    [testTemplateBodies, testContextParsed.value]
  );
  const testMissingSummary = useMemo(
    () => testMissingByBody.map((body) => `${body.label}: ${body.missing.join(', ')}`).join('; '),
    [testMissingByBody]
  );
  // Block submission before any network call: invalid JSON, or a body whose
  // parameters the context does not provide.
  const testBlockedReason = testContextParsed.error
    ? 'Context is not valid JSON.'
    : testMissingByBody.length
      ? `Missing template parameters — ${testMissingSummary}.`
      : null;

  const openTest = useCallback(
    (row: Record<string, unknown>) => {
      const templateId = String(row.templateId ?? '');
      const template = templates.find((item) => String(item.id) === templateId) ?? null;
      setTestRow(row);
      // Prefill with the existing sample so the rule can be exercised as-is.
      setTestContext(formatSampleContext(template));
      setTestPhone('');
      setTestEmail('');
      setTestPrintFormat('');
      setTestResult(null);
      setTestError(null);
    },
    [templates]
  );

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

    // Visible validation before submission: never POST a context that leaves a
    // template body without one of its parameters (the backend would fail that
    // body's delivery).
    const missingByBody = buildPreview(testTemplateBodies, context)
      .filter((channel) => channel.missingParams.length > 0)
      .map((channel) => `${channel.label}: ${channel.missingParams.join(', ')}`);
    if (missingByBody.length) {
      setTestError(`Missing template parameters — ${missingByBody.join('; ')}.`);
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
    [organizationId, scopeKey, scopeParams, events, templates, channels, openTest]
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
        <Stack gap="sm" data-testid="dispatch-test-modal">
          <Text size="sm" c="dimmed">
            Sends the event through its configured dispatch rules. Conversation renders the template
            bodies (including A4/POS print bodies) and records the delivery.
          </Text>

          <TextInput
            label="Event key"
            value={testEvent?.key ?? ''}
            readOnly
            ff="monospace"
            data-testid="dispatch-test-event-key"
          />

          <Group grow>
            <TextInput
              label="Phone"
              placeholder="+2348000000000"
              value={testPhone}
              onChange={(event) => setTestPhone(event.currentTarget.value)}
              data-testid="dispatch-test-phone"
            />
            <TextInput
              label="Email"
              placeholder="patient@example.com"
              value={testEmail}
              onChange={(event) => setTestEmail(event.currentTarget.value)}
              data-testid="dispatch-test-email"
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
            data-testid="dispatch-test-print-format"
          />

          <Textarea
            label="Context (JSON)"
            description={
              testTemplate && testSampleTokens.length
                ? `Prefilled with ${testSampleTokens.length} sample token(s) from template "${testTemplate.code}". Edit before sending if needed.`
                : 'Template variables, e.g. patient_name, invoiceNo, itemLines.'
            }
            minRows={10}
            autosize
            ff="monospace"
            value={testContext}
            onChange={(event) => setTestContext(event.currentTarget.value)}
            data-testid="dispatch-test-context"
          />

          {testRow && (
            <DispatchPreview
              bodies={testTemplateBodies}
              context={testContextParsed.value}
              contextError={testContextParsed.error}
              loading={testBodiesLoading}
            />
          )}

          {testError && (
            <Text size="sm" c="red" data-testid="dispatch-test-error">
              {testError}
            </Text>
          )}

          {testResult != null && (
            <div data-testid="dispatch-test-result">
              <Text size="xs" c="dimmed" mb={4}>
                Response
              </Text>
              <Code block style={{ maxHeight: 240, overflow: 'auto' }}>
                {JSON.stringify(testResult, null, 2)}
              </Code>
            </div>
          )}

          {testBlockedReason && (
            <Text size="sm" c="red" data-testid="dispatch-test-blocked">
              {testBlockedReason}
            </Text>
          )}

          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => setTestContext(testSample)}
              disabled={testContext === testSample}
              data-testid="dispatch-test-reset-sample"
            >
              Reset sample
            </Button>
            <Button
              variant="default"
              onClick={() => setTestRow(null)}
              data-testid="dispatch-test-close"
            >
              Close
            </Button>
            <Button
              loading={testSubmitting}
              onClick={submitTest}
              disabled={Boolean(testBlockedReason)}
              title={testBlockedReason ?? undefined}
              data-testid="dispatch-test-send"
            >
              Send test
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
