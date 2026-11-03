import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { AlertCircle, Bot, MessageSquare, RotateCcw, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePatientAssistant } from './use-patient-assistant';

type PatientAssistantWidgetProps = {
  patient: {
    patientId: string;
    fullName: string;
  };
};

function MessageBubble({
  role,
  text,
  optimistic,
}: {
  role: 'user' | 'bot';
  text: string;
  optimistic?: boolean;
}) {
  const isUser = role === 'user';
  return (
    <Group justify={isUser ? 'flex-end' : 'flex-start'} wrap="nowrap">
      <Box
        style={{
          maxWidth: '82%',
          borderRadius: 14,
          padding: '8px 12px',
          background: isUser ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-1)',
          color: isUser ? 'white' : 'var(--mantine-color-dark-8)',
          opacity: optimistic ? 0.75 : 1,
        }}
      >
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {text}
        </Text>
      </Box>
    </Group>
  );
}

export function PatientAssistantWidget({
  patient,
}: PatientAssistantWidgetProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [draft, setDraft] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    sending,
    thinking,
    connected,
    ended,
    error,
    send,
    reset,
  } = usePatientAssistant({
    patientMrn: patient.patientId,
    open: opened,
  });

  useEffect(() => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [messages, thinking, opened]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void send(text);
  };

  return (
    <>
      <ActionIcon
        variant="filled"
        radius="xl"
        size={54}
        aria-label="Open patient assistant"
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 200,
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
        }}
        onClick={open}
      >
        <MessageSquare size={22} />
      </ActionIcon>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="md"
        title={
          <Group gap="xs">
            <Bot size={18} />
            <Text fw={700}>Patient Assistant</Text>
            <Badge variant="light" size="sm">
              {patient.patientId}
            </Badge>
          </Group>
        }
      >
        <Stack h="calc(100vh - 110px)" gap="sm">
          <Group justify="space-between">
            <Text size="sm" fw={600}>
              {patient.fullName}
            </Text>
            <Group gap={6}>
              <Text size="xs" c="dimmed">
                {connected ? 'Online' : 'Connecting…'}
              </Text>
              <ActionIcon
                size="sm"
                variant="subtle"
                aria-label="Start a new conversation"
                onClick={reset}
              >
                <RotateCcw size={14} />
              </ActionIcon>
            </Group>
          </Group>

          {error && (
            <Alert color="red" icon={<AlertCircle size={16} />} py={6}>
              {error}
            </Alert>
          )}

          <Box
            ref={viewportRef}
            style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}
          >
            <Stack gap="xs">
              {messages.length === 0 && !thinking && (
                <Text size="sm" c="dimmed">
                  Ask about this patient&apos;s diagnosis, vitals, biodata,
                  medications, prescriptions or laboratory requests.
                </Text>
              )}
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  text={message.text}
                  optimistic={message.optimistic}
                />
              ))}
              {thinking && (
                <Group gap="xs">
                  <Loader size="xs" />
                  <Text size="xs" c="dimmed">
                    Consulting patient records…
                  </Text>
                </Group>
              )}
            </Stack>
          </Box>

          {ended && (
            <Button
              variant="light"
              leftSection={<RotateCcw size={14} />}
              onClick={reset}
            >
              Start new conversation
            </Button>
          )}

          <Group align="flex-end" gap="xs" wrap="nowrap">
            <Textarea
              style={{ flex: 1 }}
              placeholder="Ask about this patient…"
              autosize
              minRows={1}
              maxRows={4}
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <ActionIcon
              size="lg"
              aria-label="Send message"
              loading={sending}
              disabled={!draft.trim()}
              onClick={handleSend}
            >
              <Send size={16} />
            </ActionIcon>
          </Group>

          <Text size="xs" c="dimmed">
            AI can make mistakes. Verify clinical data before acting on it.
          </Text>
        </Stack>
      </Drawer>
    </>
  );
}
