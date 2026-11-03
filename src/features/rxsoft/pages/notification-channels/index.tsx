import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { getArrayPayload } from '@/features/components/utils';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { identityApi } from '@/lib/identity-api';
import { useAuthStore } from '@/stores/auth-store';
import { buildNotificationChannelsConfig, type ChannelRow } from './schema';

type OrgOption = { id: string; name: string; code?: string };

type TestResult = {
  sent?: boolean;
  status?: string;
  downstreamMessage?: string;
  downstreamResponse?: unknown;
  error?: unknown;
  fallback?: {
    sent?: boolean;
    status?: string;
    channelId?: string;
    channelType?: string;
    downstreamMessage?: string;
    downstreamResponse?: unknown;
    error?: unknown;
  } | null;
};

export function RxNotificationChannelsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [testTarget, setTestTarget] = useState<ChannelRow | null>(null);
  const [testRecipient, setTestRecipient] = useState('');
  const [testMessage, setTestMessage] = useState('This is a test notification.');
  const [emailHtml, setEmailHtml] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('en');
  const [templateParameters, setTemplateParameters] = useState('');
  const [fallbackTemplateName, setFallbackTemplateName] = useState('');
  const [fallbackTemplateLanguage, setFallbackTemplateLanguage] = useState('en');
  const [fallbackTemplateParameters, setFallbackTemplateParameters] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const { data: organizations = [], isLoading: loadingOrganizations } = useQuery({
    queryKey: ['notification-channels', 'organizations'],
    enabled: isSuperAdmin,
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await identityApi.get('/organizations', { params: { limit: 200 } });
      return (data?.data ?? data ?? []) as OrgOption[];
    },
  });

  useEffect(() => {
    if (isSuperAdmin && !organizationId && organizations[0]?.id) {
      setOrganizationId(organizations[0].id);
    }
  }, [isSuperAdmin, organizationId, organizations]);

  const canLoad = !isSuperAdmin || Boolean(organizationId);
  const scopeParams = isSuperAdmin && organizationId ? { organizationId } : {};

  const { data: channels = [] } = useQuery({
    queryKey: ['notification-channels', organizationId ?? 'global', 'options'],
    enabled: canLoad,
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-channels', {
        params: { ...scopeParams, includeGlobal: true, limit: 200 },
      });
      return getArrayPayload(data) as ChannelRow[];
    },
  });

  const organizationOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: org.code ? `${org.code} - ${org.name}` : org.name,
      })),
    [organizations]
  );

  const config = useMemo(
    () =>
      buildNotificationChannelsConfig({
        channels,
        organizationId: isSuperAdmin ? organizationId : null,
        canManageGlobal: isSuperAdmin,
        onTest: (row) => {
          setTestTarget(row);
          setTestRecipient(row.testRecipient ?? '');
          setTestMessage(row.testMessage || 'This is a test notification.');
          setEmailHtml('');
          setPdfUrl('');
          setPdfFileName('');
          setTemplateName('');
          setTemplateLanguage('en');
          setTemplateParameters('');
          setFallbackTemplateName('');
          setFallbackTemplateLanguage('en');
          setFallbackTemplateParameters('');
          setTestResult(null);
        },
      }),
    [channels, isSuperAdmin, organizationId]
  );

  const testMutation = useMutation({
    mutationFn: async () => {
      if (!testTarget) throw new Error('No channel selected');
      const parameters = templateParameters
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const fallbackParameters = fallbackTemplateParameters
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const fallbackChannel = testTarget.fallbackChannelId
        ? channels.find((channel) => channel.id === testTarget.fallbackChannelId)
        : null;
      const { data } = await conversationApi.post(
        `/notification-channels/${testTarget.id}/test`,
        {
          recipient: testRecipient.trim(),
          message: testMessage.trim(),
          ...(testTarget.type === 'email' && emailHtml.trim() ? { html: emailHtml.trim() } : {}),
          ...(pdfUrl.trim()
            ? {
                pdfUrl: pdfUrl.trim(),
                pdfFileName: pdfFileName.trim() || 'document.pdf',
              }
            : {}),
          ...(testTarget.type === 'whatsapp_template' && templateName.trim()
            ? {
                whatsappTemplate: {
                  name: templateName.trim(),
                  language: templateLanguage.trim() || 'en',
                  components: parameters.length
                    ? [
                        {
                          type: 'body',
                          parameters: parameters.map((text) => ({ type: 'text', text })),
                        },
                      ]
                    : [],
                },
              }
            : {}),
          ...(fallbackChannel?.type === 'whatsapp_template' && fallbackTemplateName.trim()
            ? {
                fallbackWhatsappTemplate: {
                  name: fallbackTemplateName.trim(),
                  language: fallbackTemplateLanguage.trim() || 'en',
                  components: fallbackParameters.length
                    ? [
                        {
                          type: 'body',
                          parameters: fallbackParameters.map((text) => ({
                            type: 'text',
                            text,
                          })),
                        },
                      ]
                    : [],
                },
              }
            : {}),
        },
        { params: isSuperAdmin && organizationId ? { organizationId } : {} }
      );
      return data as TestResult;
    },
    onSuccess: (data) => {
      setTestResult(data);
      notifications.show({
        color: data?.sent ? (data?.status === 'queued' ? 'blue' : 'green') : 'red',
        message: data?.downstreamMessage ?? 'Test finished',
      });
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  return (
    <Stack gap="lg">
      {isSuperAdmin && (
        <Card withBorder radius="md" padding="lg">
          <Select
            label="Facility (organisation)"
            placeholder={loadingOrganizations ? 'Loading organisations…' : 'Select an organisation'}
            data={organizationOptions}
            value={organizationId}
            onChange={(value) => setOrganizationId(value ?? null)}
            searchable
            clearable
            disabled={loadingOrganizations}
            nothingFoundMessage="No organisations found"
          />
        </Card>
      )}

      {!canLoad ? (
        <Text c="dimmed" ta="center" py="xl">
          Select an organisation to configure its channels.
        </Text>
      ) : (
        <DataPageShell key={organizationId ?? 'global'} config={config} />
      )}

      <Modal
        opened={Boolean(testTarget)}
        onClose={() => setTestTarget(null)}
        title={testTarget ? `Test ${testTarget.label}` : 'Test channel'}
        centered
        size="lg"
      >
        {testTarget && (
          <Stack>
            <TextInput
              label="Test recipient"
              placeholder={testTarget.type === 'email' ? 'name@example.com' : '+234…'}
              value={testRecipient}
              onChange={(event) => setTestRecipient(event.currentTarget.value)}
            />
            <Textarea
              label="Test message"
              description={
                testTarget.type === 'email'
                  ? 'Plain-text part. If it looks like HTML and no HTML body is provided, it is sent as HTML.'
                  : undefined
              }
              minRows={3}
              value={testMessage}
              onChange={(event) => setTestMessage(event.currentTarget.value)}
            />
            {testTarget.type === 'email' && (
              <Textarea
                label="HTML body (optional)"
                description="When set, the email is sent multipart: plain text above plus this HTML."
                minRows={4}
                value={emailHtml}
                onChange={(event) => setEmailHtml(event.currentTarget.value)}
              />
            )}
            {testTarget.type === 'whatsapp_template' && (
              <>
                <TextInput
                  label="WhatsApp template name"
                  placeholder="e.g. order_confirmation_v2"
                  value={templateName}
                  onChange={(event) => setTemplateName(event.currentTarget.value)}
                />
                <TextInput
                  label="Template language"
                  description="Meta language code, e.g. en, en_GB, fr"
                  placeholder="en"
                  value={templateLanguage}
                  onChange={(event) => setTemplateLanguage(event.currentTarget.value)}
                />
                <TextInput
                  label="Template parameters"
                  description="Comma-separated body parameters, in order"
                  placeholder="Ada Obi, SO-2026-0001, ₦3,510.00"
                  value={templateParameters}
                  onChange={(event) => setTemplateParameters(event.currentTarget.value)}
                />
              </>
            )}

            <Divider label="Document attachment (optional)" labelPosition="left" />
            <TextInput
              label="Document PDF URL"
              description="When set the test uses the channel media path: WhatsApp document, SMS link, email attachment."
              placeholder="https://…/document.pdf"
              value={pdfUrl}
              onChange={(event) => setPdfUrl(event.currentTarget.value)}
            />
            <TextInput
              label="Document file name"
              placeholder="document.pdf"
              value={pdfFileName}
              onChange={(event) => setPdfFileName(event.currentTarget.value)}
            />

            {testTarget.fallbackChannelId &&
              (() => {
                const fallbackChannel = channels.find(
                  (channel) => channel.id === testTarget.fallbackChannelId
                );
                if (!fallbackChannel) return null;
                return (
                  <>
                    <Divider
                      label={`Fallback: ${fallbackChannel.label} (${fallbackChannel.type})`}
                      labelPosition="left"
                    />
                    {fallbackChannel.type === 'whatsapp_template' ? (
                      <>
                        <TextInput
                          label="Fallback template name"
                          placeholder="e.g. order_confirmation_fallback"
                          value={fallbackTemplateName}
                          onChange={(event) => setFallbackTemplateName(event.currentTarget.value)}
                        />
                        <TextInput
                          label="Fallback template language"
                          description="Meta language code, e.g. en, en_GB, fr"
                          placeholder="en"
                          value={fallbackTemplateLanguage}
                          onChange={(event) =>
                            setFallbackTemplateLanguage(event.currentTarget.value)
                          }
                        />
                        <TextInput
                          label="Fallback template parameters"
                          description="Comma-separated body parameters for the fallback template"
                          value={fallbackTemplateParameters}
                          onChange={(event) =>
                            setFallbackTemplateParameters(event.currentTarget.value)
                          }
                        />
                      </>
                    ) : (
                      <Text size="xs" c="dimmed">
                        The fallback uses the same recipient and message; no additional template
                        fields are required.
                      </Text>
                    )}
                  </>
                );
              })()}

            {testResult && (
              <Paper withBorder p="sm" radius="sm">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={600}>
                    Downstream response
                  </Text>
                  <Badge
                    color={
                      testResult.status === 'success'
                        ? 'green'
                        : testResult.status === 'queued'
                          ? 'blue'
                          : 'red'
                    }
                  >
                    {testResult.status ?? 'unknown'}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mb="xs">
                  {testResult.downstreamMessage}
                </Text>
                <Box
                  component="pre"
                  style={{
                    margin: 0,
                    maxHeight: 220,
                    overflow: 'auto',
                    fontSize: 11,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {JSON.stringify(
                    testResult.downstreamResponse ?? testResult.error ?? testResult,
                    null,
                    2
                  )}
                </Box>

                {testResult.fallback && (
                  <Box
                    mt="sm"
                    pt="sm"
                    style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={600}>
                        Fallback response ({testResult.fallback.channelType ?? 'fallback'})
                      </Text>
                      <Badge
                        color={
                          testResult.fallback.status === 'success'
                            ? 'green'
                            : testResult.fallback.status === 'queued'
                              ? 'blue'
                              : 'red'
                        }
                      >
                        {testResult.fallback.status ?? 'unknown'}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mb="xs">
                      {testResult.fallback.downstreamMessage}
                    </Text>
                    <Box
                      component="pre"
                      style={{
                        margin: 0,
                        maxHeight: 180,
                        overflow: 'auto',
                        fontSize: 11,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {JSON.stringify(
                        testResult.fallback.downstreamResponse ??
                          testResult.fallback.error ??
                          testResult.fallback,
                        null,
                        2
                      )}
                    </Box>
                  </Box>
                )}
              </Paper>
            )}

            <Group justify="flex-end">
              <Button variant="default" onClick={() => setTestTarget(null)}>
                Close
              </Button>
              <Button
                leftSection={<Send size={14} />}
                loading={testMutation.isPending}
                disabled={
                  !testRecipient.trim() ||
                  !testMessage.trim() ||
                  (() => {
                    const fb = testTarget.fallbackChannelId
                      ? channels.find((channel) => channel.id === testTarget.fallbackChannelId)
                      : null;
                    return fb?.type === 'whatsapp_template' && !fallbackTemplateName.trim();
                  })()
                }
                onClick={() => testMutation.mutate()}
                data-testid="notification-channel-test-send"
              >
                Send test
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
