import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  ArrowLeft,
  MessageCircle,
  MessagesSquare,
  Paperclip,
  Search,
  Send,
} from 'lucide-react';
import { WebsiteLayout, green, darkGreen, ink, muted, line, soft } from '../website/layout';
import { TypingBubble } from '@/components/typing-dots';
import { useAuthStore } from '../website/auth-store';
import { ChatPhoneGate } from '../website/chat-phone-gate';
import {
  useShopChatThread,
  useShopInbox,
  useShopParticipant,
  getStoredPhone,
  storePhone,
  type ChatMessage,
  type ShopConversationSummary,
} from '../website/chatbot-service';

interface ChatIdentity {
  phone: string;
  guest: boolean;
}

type Filter = 'all' | 'unread' | 'active';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'active', label: 'Active' },
];

function parseChoiceMessage(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return null;
  }
  const title = lines[0];
  const options = lines
    .slice(1)
    .filter((l) => l.includes(':'))
    .map((line) => {
      const clean = line.replace(/\u200B/g, '').trim();
      const idx = clean.indexOf(':');
      return idx === -1
        ? null
        : { value: clean.slice(0, idx).trim(), label: clean.slice(idx + 1).trim() };
    })
    .filter((option): option is { value: string; label: string } =>
      Boolean(option?.value && option?.label),
    );
  return options.length > 0 ? { title, options } : null;
}

function conversationName(conversation?: ShopConversationSummary): string {
  if (conversation?.title) {
    return conversation.title;
  }
  const participant = conversation?.participant;
  const name = [participant?.firstName, participant?.lastName].filter(Boolean).join(' ').trim();
  return name || participant?.phone || 'Damorex Assistant';
}

/** Statuses that mean the conversation is no longer accepting messages. */
function isConversationEnded(status?: string): boolean {
  return Boolean(status) && status !== 'ACTIVE';
}

const endedYellow = '#EAB308';

function formatTime(value?: string): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

export default function ShopConversationPage() {
  const authPhone = useAuthStore((state) => state.user?.phone);
  const isMobile = useMediaQuery('(max-width: 820px)');
  const [identity, setIdentity] = useState<ChatIdentity | null>(() => {
    if (authPhone) {
      return { phone: authPhone, guest: false };
    }
    const stored = getStoredPhone();
    return stored ? { phone: stored, guest: true } : null;
  });

  const handleIdentity = (result: ChatIdentity) => {
    storePhone(result.phone);
    setIdentity(result);
  };

  if (!identity) {
    return (
      <WebsiteLayout>
        <Container size="sm" py={{ base: 40, md: 72 }}>
          <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
            <Stack align="center" gap={6} mb="lg">
              <Avatar radius="xl" size={56} style={{ background: soft }} color={green}>
                <MessagesSquare size={26} />
              </Avatar>
              <Title order={2} className="damorex-heading" c={ink} ta="center">
                Talk to a Damorex pharmacist
              </Title>
              <Text c={muted} size="sm" ta="center" lh={1.6}>
                Ask about a medication, track an order, or upload a prescription. Verify your
                number to keep your conversation history.
              </Text>
            </Stack>
            <ChatPhoneGate onDone={handleIdentity} />
          </Paper>
        </Container>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <ConversationWorkspace
        identity={identity}
        isMobile={Boolean(isMobile)}
        onChangeIdentity={handleIdentity}
      />
    </WebsiteLayout>
  );
}

function ConversationWorkspace(props: {
  identity: ChatIdentity;
  isMobile: boolean;
  onChangeIdentity: (result: ChatIdentity) => void;
}) {
  const { identity, isMobile } = props;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [showThread, setShowThread] = useState(false);
  const [changing, setChanging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const participantQuery = useShopParticipant(identity.phone);
  const participantId = participantQuery.data?.id;

  const inboxQuery = useShopInbox(participantId);
  const conversations = useMemo(
    () => inboxQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [inboxQuery.data],
  );

  const session = useShopChatThread({
    senderPhone: identity.phone,
    guest: identity.guest,
    enabled: true,
    initialConversationId: null,
    participantId,
  });
  const { messages, connected, sending, send } = session;

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    session.openConversation(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || session.loadingMore) {
      return;
    }
    viewport.scrollTo({ top: viewport.scrollHeight });
  }, [
    messages.length,
    session.loadingMore,
    session.conversationId,
    session.typing,
    session.isLoading,
  ]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (filter === 'unread' && !(conversation.unreadCount ?? 0)) {
        return false;
      }
      if (filter === 'active' && conversation.status !== 'ACTIVE') {
        return false;
      }
      if (!query) {
        return true;
      }
      const name = conversationName(conversation).toLowerCase();
      return (
        name.includes(query) ||
        (conversation.lastMessage?.text ?? '').toLowerCase().includes(query)
      );
    });
  }, [conversations, filter, search]);

  const selected = conversations.find((c) => c.conversationId === selectedId);
  const ended = isConversationEnded(selected?.status);

  const handleSelect = (conversationId: string) => {
    setSelectedId(conversationId);
    session.openConversation(conversationId);
    setShowThread(true);
  };

  const startNewChat = () => {
    setDraft('');
    setSelectedId(null);
    session.startNew();
    setShowThread(true);
  };

  const submit = () => {
    const text = draft.trim();
    if (!text || sending || ended) {
      return;
    }
    void send(text);
    setDraft('');
    setShowThread(true);
  };

  if (changing) {
    return (
      <Container size="sm" py={{ base: 28, md: 48 }}>
        <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
          <Stack gap="sm" mb="lg">
            <Title order={3} className="damorex-heading" c={ink}>
              Update your number
            </Title>
            <Text c={muted} size="sm">
              We&apos;ll use this number for your conversations from now on.
            </Text>
          </Stack>
          <ChatPhoneGate
            onDone={(result) => {
              props.onChangeIdentity(result);
              setChanging(false);
            }}
          />
          <Button variant="subtle" color="gray" size="xs" mt="md" onClick={() => setChanging(false)}>
            Cancel
          </Button>
        </Paper>
      </Container>
    );
  }

  const listPanel = (
    <Paper
      withBorder
      style={{
        borderColor: line,
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <Box p="md" style={{ borderBottom: `1px solid ${line}` }}>
        <Group justify="space-between" mb="sm">
          <Text fw={800} c={ink}>
            Inbox
          </Text>
          <Group gap={6}>
            <Badge
              color={connected ? 'green' : 'gray'}
              variant="light"
              size="sm"
              leftSection={<MessageCircle size={11} />}
            >
              {connected ? 'Live' : 'Offline'}
            </Badge>
            <Button size="xs" radius="xl" color="green" onClick={startNewChat}>
              New
            </Button>
          </Group>
        </Group>
        <TextInput
          placeholder="Search conversations..."
          leftSection={<Search size={15} />}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          radius="md"
          size="sm"
        />
      </Box>

      <Group gap={8} px="md" py={10} style={{ borderBottom: `1px solid ${line}` }}>
        {FILTERS.map((item) => (
          <Button
            key={item.value}
            size="compact-xs"
            radius="xl"
            variant={filter === item.value ? 'light' : 'default'}
            color={filter === item.value ? 'green' : 'gray'}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </Group>

      <ScrollArea flex={1}>
        <Stack gap={4} p={6}>
          {inboxQuery.isLoading && (
            <Center py="xl">
              <Loader size="sm" />
            </Center>
          )}
          {!inboxQuery.isLoading && filtered.length === 0 && (
            <Center py={48}>
              <Stack align="center" gap={4}>
                <MessagesSquare size={28} color={muted} />
                <Text fw={700} c={ink} size="sm">
                  No conversations yet
                </Text>
                <Text c={muted} size="xs" ta="center">
                  Start a chat and your pharmacist will reply here.
                </Text>
              </Stack>
            </Center>
          )}
          {filtered.map((conversation) => (
            <ConversationRow
              key={conversation.conversationId}
              conversation={conversation}
              active={conversation.conversationId === selectedId}
              onClick={() => handleSelect(conversation.conversationId)}
            />
          ))}
          {inboxQuery.hasNextPage && (
            <Button
              variant="subtle"
              size="xs"
              color="gray"
              loading={inboxQuery.isFetchingNextPage}
              onClick={() => inboxQuery.fetchNextPage()}
            >
              Load more
            </Button>
          )}
        </Stack>
      </ScrollArea>

      <Box p="sm" style={{ borderTop: `1px solid ${line}` }}>
        <Group justify="space-between">
          <Text size="xs" c={muted}>
            {identity.guest ? 'Guest' : 'Verified'} · {identity.phone}
          </Text>
          <Button size="compact-xs" variant="subtle" color="gray" onClick={() => setChanging(true)}>
            Change
          </Button>
        </Group>
      </Box>
    </Paper>
  );

  const threadPanel = (
    <Paper
      withBorder
      style={{
        borderColor: line,
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: '#fff',
      }}
    >
      <Group
        p="md"
        justify="space-between"
        wrap="nowrap"
        style={{ borderBottom: `1px solid ${line}` }}
      >
        <Group wrap="nowrap" gap="sm">
          {isMobile && (
            <ActionIcon variant="subtle" onClick={() => setShowThread(false)} aria-label="Back">
              <ArrowLeft size={18} />
            </ActionIcon>
          )}
          <Avatar radius="xl" style={{ background: darkGreen }} color="white">
            {conversationName(selected).charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Text fw={700} c={ink} lineClamp={1}>
              {selected ? conversationName(selected) : 'Damorex Assistant'}
            </Text>
            <Group gap={6}>
              <Box
                w={7}
                h={7}
                style={{ borderRadius: '50%', background: connected ? green : muted }}
              />
              <Text size="xs" c={muted}>
                {connected ? 'Online' : 'Connecting...'}
              </Text>
            </Group>
          </Box>
        </Group>
        {selected?.status && (
          <Badge variant="light" color={selected.status === 'ACTIVE' ? 'green' : 'yellow'}>
            {selected.status}
          </Badge>
        )}
      </Group>

      {selected?.currentQuestion?.text && (
        <Box
          mx="md"
          mt="sm"
          px="md"
          py={8}
          style={{ background: soft, border: `1px solid ${line}`, borderRadius: 12 }}
        >
          <Group gap={8} wrap="nowrap">
            <Box
              w={8}
              h={8}
              style={{ borderRadius: '50%', background: green, flexShrink: 0 }}
            />
            <Text size="xs" c={darkGreen} fw={600}>
              {selected.currentQuestion.text}
            </Text>
          </Group>
        </Box>
      )}

      <ScrollArea
        flex={1}
        viewportRef={viewportRef}
        onScrollPositionChange={({ y }) => {
          if (y <= 40 && session.hasMore && !session.loadingMore) {
            void session.fetchOlder();
          }
        }}
      >
        <Stack gap="sm" p="md">
          {session.isLoading && (
            <Center py="xl">
              <TypingBubble background={soft} color={green} />
            </Center>
          )}
          {!session.isLoading && messages.length === 0 && (
            <Center py={64}>
              <Text c={muted} size="sm" ta="center" maw={280}>
                Send the first message to start the conversation.
              </Text>
            </Center>
          )}
          {!session.isLoading &&
            messages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                onOption={send}
                disabled={sending || ended}
              />
            ))}
          {session.loadingMore && (
            <Center>
              <Loader size="xs" />
            </Center>
          )}
          {!session.isLoading && session.typing && (
            <TypingBubble background={soft} color={green} />
          )}
        </Stack>
      </ScrollArea>

      <Box p="md" style={{ borderTop: `1px solid ${line}` }}>
        {ended ? (
          <Group justify="center" gap="xs">
            <Text size="sm" c={muted} ta="center">
              This conversation has ended.
            </Text>
            <Button size="compact-sm" radius="xl" color="green" onClick={startNewChat}>
              Start a new chat
            </Button>
          </Group>
        ) : (
          <Group align="flex-end" gap="xs" wrap="nowrap">
            <ActionIcon variant="subtle" size="lg" aria-label="Attach">
              <Paperclip size={18} />
            </ActionIcon>
            <Textarea
              autosize
              minRows={1}
              maxRows={4}
              placeholder="Type a message..."
              value={draft}
              disabled={ended}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              style={{ flex: 1 }}
            />
            <Button
              radius="md"
              color="green"
              leftSection={<Send size={16} />}
              loading={sending}
              disabled={!draft.trim() || ended}
              onClick={submit}
            >
              Send
            </Button>
          </Group>
        )}
      </Box>
    </Paper>
  );

  return (
    <Container size="xl" py={{ base: 20, md: 32 }}>
      <Stack gap={4} mb="md">
        <Title order={1} className="damorex-heading" c={ink}>
          Conversations
        </Title>
        <Text c={muted} size="sm">
          Message your pharmacist, track prescription reviews, and get delivery updates in one
          place.
        </Text>
      </Stack>

      {isMobile ? (
        <Box style={{ height: 'calc(100vh - 220px)', minHeight: 480 }}>
          {showThread ? threadPanel : listPanel}
        </Box>
      ) : (
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: '340px 1fr',
            gap: 16,
            height: 'calc(100vh - 240px)',
            minHeight: 520,
          }}
        >
          {listPanel}
          {threadPanel}
        </Box>
      )}
    </Container>
  );
}

function ConversationRow(props: {
  conversation: ShopConversationSummary;
  active: boolean;
  onClick: () => void;
}) {
  const { conversation } = props;
  return (
    <Box
      onClick={props.onClick}
      style={{
        display: 'flex',
        gap: 10,
        padding: 10,
        borderRadius: 14,
        cursor: 'pointer',
        border: props.active ? `1px solid ${line}` : '1px solid transparent',
        background: props.active ? soft : 'transparent',
        alignItems: 'flex-start',
      }}
    >
      <Avatar radius="xl" style={{ background: darkGreen, flexShrink: 0 }} color="white">
        {conversationName(conversation).charAt(0).toUpperCase()}
      </Avatar>
      <Box style={{ minWidth: 0, flex: 1 }}>
        <Group justify="space-between" gap={8} wrap="nowrap">
          <Text fw={700} size="sm" c={ink} lineClamp={1}>
            {conversationName(conversation)}
          </Text>
          <Text size="10px" c={muted} style={{ flexShrink: 0 }}>
            {formatTime(conversation.lastMessageAt)}
          </Text>
        </Group>
        <Text size="xs" c={muted} lineClamp={1} mt={2}>
          {conversation.lastMessage?.text ?? 'No messages yet'}
        </Text>
      </Box>
      {(Boolean(conversation.unreadCount) || isConversationEnded(conversation.status)) && (
        <Box
          w={8}
          h={8}
          mt={6}
          style={{
            borderRadius: '50%',
            background: isConversationEnded(conversation.status) ? endedYellow : green,
            flexShrink: 0,
          }}
        />
      )}
    </Box>
  );
}

function MessageRow(props: {
  message: ChatMessage;
  onOption: (value: string) => void;
  disabled?: boolean;
}) {
  const { message } = props;
  const isUser = message.role === 'user';
  const choice = !isUser ? parseChoiceMessage(message.text) : null;

  if (choice) {
    return (
      <Box style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
        <Text fw={600} size="sm" c={ink} mb={6}>
          {choice.title}
        </Text>
        <Stack gap={6}>
          {choice.options.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              color="green"
              size="sm"
              radius="md"
              disabled={props.disabled}
              onClick={() => props.onOption(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      p="sm"
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '72%',
        background: isUser ? green : soft,
        color: isUser ? '#fff' : ink,
        borderRadius: 14,
        borderBottomRightRadius: isUser ? 4 : 14,
        borderBottomLeftRadius: isUser ? 14 : 4,
        opacity: message.optimistic ? 0.72 : 1,
      }}
    >
      <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {message.text}
      </Text>
      <Text size="10px" c={isUser ? 'rgba(255,255,255,0.7)' : muted} ta="right" mt={4}>
        {formatTime(message.createdAt)}
      </Text>
    </Box>
  );
}
