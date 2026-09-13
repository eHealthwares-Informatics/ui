import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Text,
  TextInput,
  Stack,
} from '@mantine/core';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { useChatbotStore } from './chatbot-store';
import { useChatbotSession } from './chatbot-service';
import { useAuthStore } from './auth-store';
import { green, ink, muted, line, soft } from './layout';
import { QUESTIONNAIRE_CODES } from './hl7-prescription';
const ANON_PHONE_KEY = 'damorex-chatbot-phone';

interface ChoiceOption {
  value: string;
  label: string;
}

interface ChoiceMessage {
  title: string;
  options: ChoiceOption[];
}

function parseChoiceMessage(text: string): ChoiceMessage | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {return null;}

  const title = lines[0];
  const optionLines = lines.slice(1).filter((l) => l.includes(':'));
  if (optionLines.length === 0) {return null;}

  const options: ChoiceOption[] = [];
  for (const line of optionLines) {
    const clean = line.replace(/\u200B/g, '').trim();
    const idx = clean.indexOf(':');
    if (idx === -1) {continue;}
    const value = clean.slice(0, idx).trim();
    const label = clean.slice(idx + 1).trim();
    if (!value || !label) {continue;}
    options.push({ value, label });
  }

  return options.length > 0 ? { title, options } : null;
}

function getSenderPhone(): string {
  const phone = useAuthStore.getState().user?.phone || localStorage.getItem(ANON_PHONE_KEY) ||  `${Math.floor(Date.now() / 1000)  }`;
  localStorage.setItem(ANON_PHONE_KEY, phone);
  return phone;
}

export function ChatbotWidget() {
  const { open, initialMessage, questionnaireCode, close } = useChatbotStore();
  const [draft, setDraft] = useState('');
  const viewport = useRef<HTMLDivElement>(null);
  const [initialSent, setInitialSent] = useState(false);
  const senderPhone = getSenderPhone();
  const { messages, connected, sending, send, clear } = useChatbotSession(senderPhone);

  useEffect(() => {
    if (open && initialMessage && !initialSent) {
      setInitialSent(true);
      send(initialMessage, questionnaireCode);
    }
    if (!open) {
      setInitialSent(false);
      setDraft('');
      clear();
    }
  }, [open]);

  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTop = viewport.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) {return;}
    send(text);
    setDraft('');
  };

  if (!open) {
    return (
      <ActionIcon
        variant="filled"
        radius="xl"
        size={56}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: green,
          boxShadow: '0 8px 28px rgba(22, 163, 74, 0.35)',
          cursor: 'pointer',
        }}
        onClick={() =>
          useChatbotStore.getState().openWith(
            '',
            QUESTIONNAIRE_CODES.GENERAL_INQUIRY,
          )
        }
      >
        <MessageSquare size={24} />
      </ActionIcon>
    );
  }

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 380,
        maxHeight: 580,
        borderRadius: 20,
        background: '#FFFFFF',
        boxShadow: '0 24px 72px rgba(15, 23, 42, 0.18)',
        border: `1px solid ${line}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Group
        p="md"
        style={{
          borderBottom: `1px solid ${line}`,
          background: green,
          flexShrink: 0,
        }}
        justify="space-between"
      >
        <Group gap={10}>
          <Avatar size={34} radius="xl" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Bot size={18} color="white" />
          </Avatar>
          <Box>
            <Text size="sm" fw={700} c="white">
              Damorex Assistant
            </Text>
            <Text size="xs" c="rgba(255,255,255,0.72)">
              {connected ? 'Online' : 'Connecting...'}
            </Text>
          </Box>
        </Group>
        <ActionIcon
          variant="subtle"
          c="white"
          onClick={close}
          style={{ '&:hover': { background: 'rgba(255,255,255,0.15)' } }}
        >
          <X size={18} />
        </ActionIcon>
      </Group>

      <Box
        ref={viewport}
        p="sm"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 300,
        }}
      >
        {messages.length === 0 && (
          <Text c={muted} size="sm" ta="center" py="xl">
            How can we help you today?
          </Text>
        )}
        {(() => {
          const lastUserIdx = messages.reduce(
            (last, m, i) => (m.role === 'user' ? i : last),
            -1,
          );
          return messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const choice = !isUser ? parseChoiceMessage(msg.text) : null;
          const answered = idx <= lastUserIdx;

          if (choice) {
            return (
              <Box key={msg.id} style={{ alignSelf: 'flex-start', width: '100%' }}>
                <Text size="sm" fw={600} c={ink} mb={6}>
                  {choice.title}
                </Text>
                <Stack gap={6}>
                  {choice.options.map((opt) => (
                    <Button
                      key={opt.value}
                      variant="outline"
                      size="sm"
                      radius="md"
                      fullWidth
                      disabled={answered}
                      style={{
                        borderColor: answered ? muted : green,
                        color: answered ? muted : green,
                        fontWeight: 500,
                        cursor: answered ? 'default' : 'pointer',
                        opacity: answered ? 0.5 : 1,
                      }}
                      onClick={() => {
                        if (!answered) {send(opt.value);}
                      }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </Stack>
                <Text
                  size="xs"
                  c={muted}
                  ta="right"
                  mt={4}
                  pr={2}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Box>
            );
          }

          return (
            <Box
              key={msg.id}
              p="xs"
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: isUser ? green : soft,
                color: isUser ? 'white' : ink,
                borderRadius: 12,
                borderBottomRightRadius: isUser ? 4 : 12,
                borderBottomLeftRadius: isUser ? 12 : 4,
              }}
            >
              <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.text}
              </Text>
              <Text
                size="xs"
                c={isUser ? 'rgba(255,255,255,0.6)' : muted}
                ta="right"
                mt={4}
              >
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Box>
          );
        })})()}
        {sending && (
          <Text size="xs" c={muted} ta="center">
            Sending...
          </Text>
        )}
      </Box>

      <Group
        p="sm"
        gap={8}
        style={{
          borderTop: `1px solid ${line}`,
          flexShrink: 0,
        }}
      >
        <TextInput
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{ flex: 1 }}
          radius="xl"
          size="sm"
        />
        <ActionIcon
          variant="filled"
          radius="xl"
          color="green"
          size={36}
          onClick={handleSend}
          disabled={!draft.trim() || sending}
        >
          <Send size={16} />
        </ActionIcon>
      </Group>
    </Box>
  );
}
