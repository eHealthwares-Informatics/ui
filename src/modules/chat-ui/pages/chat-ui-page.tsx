import {
  ActionIcon,
  Alert,
  AppShell,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Drawer,
  Group,
  Loader,
  Menu,
  Paper,
  ScrollArea,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  AlertCircle,
  ArrowLeft,
  CheckCheck,
  MessagesSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  UserPlus,
  UserX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  useConversationInbox,
  useConversationMessages,
  useMarkConversationRead,
  useSendConversationMessage,
} from '../hooks/use-chat-queries';
import { useChatSocket } from '../hooks/use-chat-socket';
import { addProjection, findParticipantByPhone, createParticipant, listProjections } from '../services/chat-api';
import { NewConversationModal } from '../components/new-conversation-modal';
import { ParticipantModal } from '../components/participant-modal';
import type { ChatMode, ConversationInboxItem, ConversationProjection, ExchangeMessage, InboxMode } from '../types';
import { getParticipantInitials, getParticipantName } from '../utils/participants';
import { parseQuestionOptions } from '../utils/parse-options';

dayjs.extend(relativeTime);

type ChatUiPageProps = {
  mode?: ChatMode;
};

export function ChatUiPage({ mode = 'admin' }: ChatUiPageProps) {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [search, setSearch] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inboxMode, setInboxMode] = useState<InboxMode>('admin');
  const [adminParticipantId, setAdminParticipantId] = useState<string | null>(null);
  const [adminParticipantLoaded, setAdminParticipantLoaded] = useState(false);
  const [newChatOpened, { open: openNewChat, close: closeNewChat }] = useDisclosure(false);
  const [participantModalOpened, { open: openParticipantModal, close: closeParticipantModal }] =
    useDisclosure(false);
  const [participantModalMode, setParticipantModalMode] = useState<'add' | 'remove'>('add');
  const [contextConversationId, setContextConversationId] = useState<string | undefined>();

  const userPhone = useAuthStore((state) => state.user?.phone);

  useEffect(() => {
    if (!userPhone || adminParticipantLoaded) {return;}

    (async () => {
      try {
        let participant = await findParticipantByPhone(userPhone);
        if (!participant) {
          participant = await createParticipant({ phone: userPhone, firstName: 'Admin' });
        }
        if (participant?.id) {
          setAdminParticipantId(participant.id);
        }
      } catch {
        console.warn('Failed to resolve admin participant');
      } finally {
        setAdminParticipantLoaded(true);
      }
    })();
  }, [userPhone, adminParticipantLoaded]);

  const inboxQuery = useConversationInbox(search, inboxMode, adminParticipantId ?? undefined);

  const selectedConversation = useMemo(
    () =>
      inboxQuery.data?.pages
        .flatMap((page) => page.items)
        .find((item) => item.conversationId === selectedConversationId),
    [inboxQuery.data, selectedConversationId],
  );

  const activeParticipantId =
    mode === 'admin'
      ? selectedConversation?.moderator?.id
      : selectedConversation?.participant.id;
  const socket = useChatSocket({
    conversationId: selectedConversationId,
    participantId: activeParticipantId,
  });
  const markRead = useMarkConversationRead();

  useEffect(() => {
    if (!selectedConversationId) {return;}

    markRead.mutate({
      conversationId: selectedConversationId,
      participantId: activeParticipantId,
    });
  }, [activeParticipantId, selectedConversationId]);

  const conversations = inboxQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const handleNewChatCreated = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleAddMe = useCallback(async (conversationId: string) => {
    if (!adminParticipantId) {return;}
    try {
      const data = await listProjections(conversationId);
      const alreadyAdded = data.some((p) => p.participant.id === adminParticipantId);
      if (!alreadyAdded) {
        await addProjection({
          conversationId,
          participantId: adminParticipantId,
          channelId: '',
          role: 'AGENT' as any,
        });
      }
    } catch {
      console.warn('Failed to add self to conversation');
    }
  }, [adminParticipantId]);

  const inbox = (
        <InboxSidebar
          connected={socket.connected}
          conversations={conversations}
          error={inboxQuery.isError}
          fetchNextPage={() => inboxQuery.fetchNextPage()}
          hasNextPage={inboxQuery.hasNextPage}
          isFetchingNextPage={inboxQuery.isFetchingNextPage}
          loading={inboxQuery.isLoading}
          onRetry={() => inboxQuery.refetch()}
          onSearch={setSearch}
          onSelect={(conversation) => {
            setSelectedConversationId(conversation.conversationId);
            setSidebarOpen(false);
          }}
          search={search}
          selectedConversationId={selectedConversationId}
          mode={inboxMode}
          onModeChange={setInboxMode}
          onNewChat={openNewChat}
          onAddParticipant={(convId) => {
            setContextConversationId(convId);
            setParticipantModalMode('add');
            openParticipantModal();
          }}
          onRemoveParticipant={(convId) => {
            setContextConversationId(convId);
            setParticipantModalMode('remove');
            openParticipantModal();
          }}
          onAddMe={handleAddMe}
        />
  );

  return (
    <AppShell padding="md">
      <Group align="stretch" gap="md" h="calc(100vh - 32px)" wrap="nowrap">
        {!isMobile && (
          <Paper withBorder w={360} h="100%" style={{ overflow: 'hidden' }}>
            {inbox}
          </Paper>
        )}

        <Paper
          withBorder
          h="100%"
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            background: theme.colors.gray[0],
          }}
        >
          <ConversationThread
            connected={socket.connected}
            conversation={selectedConversation}
            mode={mode}
            onBack={() => setSidebarOpen(true)}
            showMobileBack={Boolean(isMobile)}
            typingParticipantId={socket.typingParticipantId}
            userPhone={userPhone}
            adminParticipantId={adminParticipantId ?? undefined}
          />
        </Paper>
      </Group>

      <Drawer
        opened={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Inbox"
        size="min(92vw, 380px)"
        padding="sm"
      >
        {inbox}
      </Drawer>

      <NewConversationModal
        opened={newChatOpened}
        onClose={closeNewChat}
        onCreated={handleNewChatCreated}
        adminParticipantId={adminParticipantId ?? undefined}
        adminPhone={userPhone}
      />

      <ParticipantModal
        opened={participantModalOpened}
        onClose={() => {
          closeParticipantModal();
          setContextConversationId(undefined);
        }}
        conversationId={contextConversationId}
        defaultMode={participantModalMode}
      />
    </AppShell>
  );
}

function InboxSidebar(props: {
  connected: boolean;
  conversations: ConversationInboxItem[];
  error: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loading: boolean;
  onRetry: () => void;
  onSearch: (value: string) => void;
  onSelect: (conversation: ConversationInboxItem) => void;
  search: string;
  selectedConversationId?: string;
  mode: InboxMode;
  onModeChange: (mode: InboxMode) => void;
  onNewChat: () => void;
  onAddParticipant: (conversationId: string) => void;
  onRemoveParticipant: (conversationId: string) => void;
  onAddMe: (conversationId: string) => void;
}) {
  return (
    <Stack h="100%" gap="sm" p="sm">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
          <SegmentedControl
            data={[
              { value: 'admin', label: 'Admin' },
              { value: 'all', label: 'All' },
              { value: 'individual', label: '1-on-1' },
              { value: 'group', label: 'Group' },
            ]}
            onChange={(v) => props.onModeChange(v as InboxMode)}
            size="xs"
            value={props.mode}
          />
        </Group>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            aria-label="New conversation"
            onClick={props.onNewChat}
            size="sm"
            variant="light"
          >
            <Plus size={14} />
          </ActionIcon>
          <Badge
            color={props.connected ? 'green' : 'gray'}
            leftSection={props.connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            size="sm"
            variant="light"
          >
            {props.connected ? 'Live' : 'Offline'}
          </Badge>
        </Group>
      </Group>

      <TextInput
        leftSection={<Search size={15} />}
        onChange={(event) => props.onSearch(event.currentTarget.value)}
        placeholder="Search conversations"
        value={props.search}
      />

      {props.error && (
        <Alert color="red" icon={<AlertCircle size={16} />} title="Inbox unavailable">
          <Group justify="space-between" mt="xs">
            <Text size="sm">Could not load conversations.</Text>
            <Button
              leftSection={<RefreshCw size={14} />}
              onClick={props.onRetry}
              size="xs"
              variant="light"
            >
              Retry
            </Button>
          </Group>
        </Alert>
      )}

      <ScrollArea
        flex={1}
        onScrollPositionChange={({ y }) => {
          if (y > 200 && props.hasNextPage && !props.isFetchingNextPage) {
            props.fetchNextPage();
          }
        }}
      >
        <Stack gap={0}>
          {props.loading &&
            Array.from({ length: 8 }).map((_, index) => (
              <Box key={index} py="sm">
                <Group wrap="nowrap">
                  <Skeleton circle h={42} w={42} />
                  <Box flex={1}>
                    <Skeleton h={12} mb={8} w="65%" />
                    <Skeleton h={10} w="92%" />
                  </Box>
                </Group>
              </Box>
            ))}

          {!props.loading && props.conversations.length === 0 && (
            <Center h={280}>
              <Stack align="center" gap="xs">
                <MessagesSquare size={34} />
                <Text fw={600}>No conversations</Text>
                <Text c="dimmed" size="sm" ta="center">
                  New messages will appear here as they arrive.
                </Text>
              </Stack>
            </Center>
          )}

          {props.conversations.map((conversation) => (
            <Fragment key={conversation.conversationId}>
              <ConversationListItem
                conversation={conversation}
                onSelect={() => props.onSelect(conversation)}
                selected={conversation.conversationId === props.selectedConversationId}
                onAddParticipant={props.onAddParticipant}
                onRemoveParticipant={props.onRemoveParticipant}
                onAddMe={(convId) => props.onAddMe(convId)}
              />
              <Divider />
            </Fragment>
          ))}

          {props.isFetchingNextPage && (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}

function ConversationListItem(props: {
  conversation: ConversationInboxItem;
  onSelect: () => void;
  selected: boolean;
  onAddParticipant: (conversationId: string) => void;
  onRemoveParticipant: (conversationId: string) => void;
  onAddMe: (conversationId: string) => void;
}) {
  const participant = props.conversation.participant;
  const name = getParticipantName(participant);
  const lastMessage = props.conversation.lastMessage?.text ?? 'No messages yet';
  const lastMessagePrefix =
    props.conversation.lastMessage?.direction === 'outbound' ? 'You: ' : '';

  const [contextMenuOpened, setContextMenuOpened] = useState(false);

  return (
    <Menu
      opened={contextMenuOpened}
      onClose={() => setContextMenuOpened(false)}
      onOpen={() => setContextMenuOpened(true)}
    >
      <Menu.Target>
        <Button
          color="blue"
          fullWidth
          h={76}
          justify="flex-start"
          onClick={props.onSelect}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuOpened(true);
          }}
          px="xs"
          radius={0}
          variant={props.selected ? 'light' : 'subtle'}
        >
          <Group gap="sm" wrap="nowrap" w="100%">
            <Box pos="relative">
              <Avatar radius="xl">{getParticipantInitials(participant)}</Avatar>
              <Box
                bg={props.conversation.projection.active ? 'green' : 'gray'}
                bottom={0}
                h={10}
                pos="absolute"
                right={0}
                style={{ border: '2px solid white', borderRadius: 999 }}
                w={10}
              />
            </Box>
            <Box flex={1} style={{ minWidth: 0 }}>
              <Group justify="space-between" wrap="nowrap">
                <Text fw={600} lineClamp={1} size="sm">
                  {name}
                </Text>
                {props.conversation.lastMessageAt && (
                  <Text c="dimmed" size="xs">
                    {dayjs(props.conversation.lastMessageAt).fromNow()}
                  </Text>
                )}
              </Group>
              <Text c="dimmed" lineClamp={1} size="xs">
                {lastMessagePrefix}
                {lastMessage}
              </Text>
            </Box>
            {Boolean(props.conversation.unreadCount) && (
              <Badge circle size="sm">
                {props.conversation.unreadCount}
              </Badge>
            )}
          </Group>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<UserPlus size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            setContextMenuOpened(false);
            props.onAddMe(props.conversation.conversationId);
          }}
        >
          Add Me
        </Menu.Item>
        <Menu.Item
          leftSection={<UserPlus size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            setContextMenuOpened(false);
            props.onAddParticipant(props.conversation.conversationId);
          }}
        >
          Add Participant
        </Menu.Item>
        <Menu.Item
          leftSection={<UserX size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            setContextMenuOpened(false);
            props.onRemoveParticipant(props.conversation.conversationId);
          }}
        >
          Remove Participant
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

function ConversationThread(props: {
  connected: boolean;
  conversation?: ConversationInboxItem;
  mode: ChatMode;
  onBack: () => void;
  showMobileBack: boolean;
  typingParticipantId?: string;
  userPhone?: string;
  adminParticipantId?: string;
}) {
  const [draft, setDraft] = useState('');
  const [projections, setProjections] = useState<ConversationProjection[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const messagesQuery = useConversationMessages(props.conversation?.conversationId);
  const sendMessage = useSendConversationMessage();
  const messages = useMemo(
    () => (messagesQuery.data?.pages.flatMap((page) => page.items) ?? []).slice().reverse(),
    [messagesQuery.data],
  );
  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);
  console.log({props})
  const senderId =
    props.mode === 'admin'
      ? projections.find(p => p.isPrimary)?.participant.id
      : props.conversation?.participant.id;

  const hasMyProjection = projections.some((p) => p.participant.id === props.adminParticipantId);
  const isCompleted = props.conversation?.status === 'COMPLETED';
  const inputDisabled = isCompleted || (!hasMyProjection && !!props.adminParticipantId);

  useEffect(() => {
    if (!props.conversation?.conversationId) {return;}
    listProjections(props.conversation.conversationId).then(setProjections).catch(() => setProjections([]));
  }, [props.conversation?.conversationId]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || messagesQuery.isFetchingNextPage) {return;}
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
  }, [messages.length, props.conversation?.conversationId]);

  if (!props.conversation) {
    return (
      <Stack align="center" h="100%" justify="center" gap="sm">
        {props.showMobileBack && (
          <ActionIcon
            aria-label="Open inbox"
            onClick={props.onBack}
            pos="absolute"
            left={24}
            top={24}
            variant="subtle"
          >
            <ArrowLeft size={18} />
          </ActionIcon>
        )}
        <MessagesSquare size={42} />
        <Text fw={700}>Your messages</Text>
        <Text c="dimmed" maw={320} size="sm" ta="center">
          Choose a conversation to review history, respond, and track realtime activity.
        </Text>
      </Stack>
    );
  }

  const conversation = props.conversation;
    console.log({conversation})

  const submit = () => {
    if (!draft.trim() || !senderId || sendMessage.isPending || inputDisabled) {return;}

    sendMessage.mutate({
      conversationId: conversation.conversationId,
      channelId: conversation.channelId,
      senderPhone: props.userPhone ?? (conversation.participant.phone || ''),
      text: draft.trim(),
    });
    setDraft('');
  };

  const fetchOlderMessages = async () => {
    const viewport = viewportRef.current;
    const previousHeight = viewport?.scrollHeight ?? 0;
    await messagesQuery.fetchNextPage();

    window.setTimeout(() => {
      if (!viewport) {return;}
      viewport.scrollTop = viewport.scrollHeight - previousHeight;
    }, 0);
  };

  return (
    <Stack h="100%" gap={0}>
      <Group bg="white" justify="space-between" p="md" wrap="nowrap">
        <Group wrap="nowrap">
          {props.showMobileBack && (
            <ActionIcon aria-label="Open inbox" onClick={props.onBack} variant="subtle">
              <ArrowLeft size={18} />
            </ActionIcon>
          )}
          <Avatar radius="xl">{getParticipantInitials(conversation.participant)}</Avatar>
          <Box>
            <Text fw={700} lineClamp={1}>
              {getParticipantName(conversation.participant)}
            </Text>
            <Group gap={6}>
              <Badge color={props.connected ? 'green' : 'gray'} size="xs">
                {props.connected ? 'Online' : 'Offline'}
              </Badge>
              <Text c="dimmed" size="xs">
                {conversation.currentQuestion?.attribute ?? conversation.state}
              </Text>
            </Group>
          </Box>
        </Group>
        <Badge variant="light">{conversation.status}</Badge>
      </Group>

      <ScrollArea flex={1} viewportRef={viewportRef}>
        <Stack gap="sm" p="md">
          {messagesQuery.hasNextPage && (
            <Center>
              <Button
                leftSection={
                  messagesQuery.isFetchingNextPage ? (
                    <Loader size={14} />
                  ) : (
                    <RefreshCw size={14} />
                  )
                }
                onClick={fetchOlderMessages}
                size="xs"
                variant="subtle"
              >
                Load earlier
              </Button>
            </Center>
          )}

          {messagesQuery.isLoading &&
            Array.from({ length: 8 }).map((_, index) => (
              <Box
                h={44}
                key={index}
                style={{
                  alignSelf: index % 2 ? 'flex-end' : 'flex-start',
                }}
                w={index % 2 ? 260 : 320}
              >
                <Skeleton h="100%" radius="md" />
              </Box>
            ))}

          {messagesQuery.isError && (
            <Alert color="red" icon={<AlertCircle size={16} />}>
              Messages could not be loaded.
            </Alert>
          )}

          {!messagesQuery.isLoading && messages.length === 0 && (
            <Center h={320}>
              <Stack align="center" gap="xs">
                <MessagesSquare size={34} />
                <Text fw={600}>No messages yet</Text>
                <Text c="dimmed" size="sm">
                  Send the first reply in this thread.
                </Text>
              </Stack>
            </Center>
          )}

          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <Fragment key={date}>
              <Divider label={dayjs(date).format('D MMM, YYYY')} labelPosition="center" />
              {dateMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onOptionSelect={(value) => {
                    sendMessage.mutate({
                      conversationId: conversation.conversationId,
                      channelId: conversation.channelId,
                      senderPhone: props.userPhone ?? (conversation.participant.phone || ''),
                      text: value,
                    });
                  }}
                />
              ))}
            </Fragment>
          ))}

          {props.typingParticipantId && (
            <Text c="dimmed" fs="italic" size="sm">
              Typing...
            </Text>
          )}
        </Stack>
      </ScrollArea>

      <Box bg="white" p="md">
        {isCompleted && (
          <Text c="dimmed" size="sm" mb="xs" ta="center">This conversation has ended.</Text>
        )}
        {!isCompleted && !hasMyProjection && !!props.adminParticipantId && (
          <Text c="dimmed" size="sm" mb="xs" ta="center">Right-click the conversation and select <b>Add Me</b> to join.</Text>
        )}
        <Group align="flex-end" gap="xs" wrap="nowrap">
          <Tooltip label="Attach file">
            <ActionIcon aria-label="Attach file" disabled={inputDisabled} size="lg" variant="subtle">
              <Paperclip size={18} />
            </ActionIcon>
          </Tooltip>
          <Textarea
            autosize
            disabled={inputDisabled}
            maxRows={4}
            minRows={1}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={inputDisabled ? '' : 'Type a message'}
            style={{ flex: 1 }}
            value={draft}
          />
          {draft}-senderId({senderId})inputDisabled-{inputDisabled}
          <Button
            disabled={!draft.trim() || !senderId || inputDisabled}
            leftSection={<Send size={16} />}
            loading={sendMessage.isPending}
            onClick={submit}
          >
            Send
          </Button>
        </Group>
      </Box>
    </Stack>
  );
}

function MessageBubble({
  message,
  onOptionSelect,
}: {
  message: ExchangeMessage;
  onOptionSelect?: (value: string) => void;
}) {
  const isOwnMessage = message.direction === 'inbound';
  const parsed = !isOwnMessage ? parseQuestionOptions(message.text) : null;

  if (parsed) {
    return (
      <Box
        bg="white"
        maw="min(72%, 560px)"
        px="sm"
        py={8}
        style={{
          alignSelf: 'flex-start',
          border: '1px solid var(--mantine-color-gray-3)',
          borderRadius: 8,
        }}
      >
        <Text fw={600} mb="xs" size="sm">
          {parsed.title}
        </Text>
        <Stack gap="xs">
          {parsed.options.map((opt) => (
            <Button
              key={opt.value}
              color="blue"
              fullWidth
              onClick={() => onOptionSelect?.(opt.value)}
              size="sm"
              variant="outline"
            >
              {opt.label}
            </Button>
          ))}
        </Stack>
        <Group gap={4} justify="flex-end" mt={4}>
          <Text c="dimmed" size="xs">
            {dayjs(message.createdAt).format('h:mm A')}
          </Text>
        </Group>
      </Box>
    );
  }

  return (
    <Box
      bg={isOwnMessage ? 'blue.6' : 'white'}
      c={isOwnMessage ? 'white' : 'dark'}
      maw="min(72%, 560px)"
      px="sm"
      py={8}
      style={{
        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
        border: isOwnMessage ? undefined : '1px solid var(--mantine-color-gray-3)',
        borderRadius: 8,
        opacity: message.optimistic ? 0.72 : 1,
      }}
    >
      <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {message.text}
      </Text>
      <Group gap={4} justify="flex-end" mt={4}>
        <Text c={isOwnMessage ? 'blue.0' : 'dimmed'} size="xs">
          {dayjs(message.createdAt).format('h:mm A')}
        </Text>
        {isOwnMessage && <CheckCheck size={13} />}
      </Group>
    </Box>
  );
}

function groupMessagesByDate(messages: ExchangeMessage[]) {
  return messages.reduce<Record<string, ExchangeMessage[]>>((acc, message) => {
    const key = dayjs(message.createdAt).format('YYYY-MM-DD');
    acc[key] = acc[key] ?? [];
    acc[key].push(message);
    return acc;
  }, {});
}
