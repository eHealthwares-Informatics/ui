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
  Paper,
  Popover,
  ScrollArea,
  SegmentedControl,
  Select,
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
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useChatPhoneStore } from '@/stores/chat-phone-store';
import {
  useConversationInbox,
  useConversationMessages,
  useMarkConversationRead,
  usePendingExchanges,
  useSendConversationMessage,
  chatKeys,
} from '../hooks/use-chat-queries';
import { useChatSocket } from '../hooks/use-chat-socket';
import { addProjection, findParticipantByPhone, createParticipant, listProjections, sendWebhookMessage } from '../services/chat-api';
import { AddProjectionModal } from '../components/add-projection-modal';
import { ParticipantModal } from '../components/participant-modal';
import { PhoneSetupModal } from '../components/phone-setup-modal';
import type {
  ChatMode,
  ConversationInboxItem,
  ConversationInboxResponse,
  ConversationProjection,
  ExchangeMessage,
  InboxMode,
  InboxStatus,
} from '../types';
import { getParticipantInitials, getParticipantName } from '../utils/participants';
import { parseQuestionOptions } from '../utils/parse-options';

dayjs.extend(relativeTime);

const WEB_CHANNEL_ID = '69bd061c11bf835d976c4e2f';

const INBOX_STATUSES: Array<{ value: InboxStatus | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'STOPPED', label: 'Stopped' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

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
  const [statusByMode, setStatusByMode] = useState<Partial<Record<InboxMode, InboxStatus | ''>>>(
    {},
  );
  const [adminParticipantId, setAdminParticipantId] = useState<string | null>(null);
  const [adminParticipantLoaded, setAdminParticipantLoaded] = useState(false);
  const [addProjectionOpened, { open: openAddProjection, close: closeAddProjection }] =
    useDisclosure(false);
  const [participantModalOpened, { open: openParticipantModal, close: closeParticipantModal }] =
    useDisclosure(false);
  const [contextConversationId, setContextConversationId] = useState<string | undefined>();
  const [contextChannelId, setContextChannelId] = useState<string | undefined>();
  const [composing, setComposing] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  const chatPhone = useChatPhoneStore((state) => state.chatPhone);
  const setChatPhone = useChatPhoneStore((state) => state.setChatPhone);
  const userPhone = useAuthStore((state) => state.user?.phone);
  const effectivePhone = chatPhone || userPhone;

  const status = statusByMode[inboxMode] ?? '';
  const handleStatusChange = (value: InboxStatus | '') =>
    setStatusByMode((prev) => ({ ...prev, [inboxMode]: value }));

  const queryClient = useQueryClient();

  useEffect(() => {
    setPageIndex(0);
  }, [search, inboxMode, status]);

  const handlePrevPage = () => {
    if (pageIndex <= 0) {return;}
    queryClient.setQueryData<{
      pages: ConversationInboxResponse[];
      pageParams: Array<string | undefined>;
    }>(chatKeys.inbox(search, inboxMode, status), (current) => {
      if (!current) {return current;}
      return {
        ...current,
        pages: current.pages.slice(0, -1),
        pageParams: current.pageParams.slice(0, -1),
      };
    });
    setPageIndex((index) => index - 1);
  };

  const handleNextPage = () => {
    if (!inboxQuery.hasNextPage || inboxQuery.isFetchingNextPage) {return;}
    inboxQuery.fetchNextPage();
    setPageIndex((index) => index + 1);
  };

  const startCompose = () => {
    setComposing(true);
    setSelectedConversationId(undefined);
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (!effectivePhone || adminParticipantLoaded) {return;}

    (async () => {
      try {
        let participant = await findParticipantByPhone(effectivePhone);
        if (!participant) {
          participant = await createParticipant({ phone: effectivePhone, firstName: 'Admin' });
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
  }, [effectivePhone, adminParticipantLoaded]);

  const inboxQuery = useConversationInbox(search, inboxMode, status, adminParticipantId ?? undefined);

  useEffect(() => {
    const pageCount = inboxQuery.data?.pages.length ?? 1;
    setPageIndex((index) => (index >= pageCount ? Math.max(0, pageCount - 1) : index));
  }, [inboxQuery.data?.pages.length]);

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
  const pendingConversationId = composing
    ? adminParticipantId
      ? `pending-${adminParticipantId}`
      : undefined
    : undefined;
  const socket = useChatSocket({
    conversationId: selectedConversationId,
    participantId: activeParticipantId,
    pendingConversationId,
    pendingParticipantId: adminParticipantId ?? undefined,
    onConversationCreated: (conversationId) => {
      // Auto-select the conversation created by the webhook flow. Ignore
      // "pending-" ids which are not real conversations yet.
      if (composing && conversationId && !conversationId.startsWith('pending-')) {
        setComposing(false);
        setSelectedConversationId(conversationId);
        setSidebarOpen(false);
      }
    },
  });
  const markRead = useMarkConversationRead();

  useEffect(() => {
    if (!selectedConversationId || selectedConversationId.startsWith('pending-')) {return;}

    markRead.mutate({
      conversationId: selectedConversationId,
      participantId: activeParticipantId,
    });
  }, [activeParticipantId, selectedConversationId]);

  const conversations = inboxQuery.data?.pages.flatMap((page) => page.items) ?? [];

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
          role: 'AGENT',
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
            isFetchingNextPage={inboxQuery.isFetchingNextPage}
            loading={inboxQuery.isLoading}
            onRetry={() => inboxQuery.refetch()}
            onSearch={setSearch}
            onSelect={(conversation) => {
              setComposing(false);
              setSelectedConversationId(conversation.conversationId);
              setSidebarOpen(false);
            }}
            search={search}
            selectedConversationId={selectedConversationId}
            mode={inboxMode}
            onModeChange={setInboxMode}
            status={status}
            onStatusChange={handleStatusChange}
            onNewChat={startCompose}
            onAddParticipant={(convId) => {
              const item = conversations.find((c) => c.conversationId === convId);
              setContextConversationId(convId);
              setContextChannelId(item?.channelId);
              openAddProjection();
            }}
            onRemoveParticipant={(convId) => {
              setContextConversationId(convId);
              openParticipantModal();
            }}
            onAddMe={handleAddMe}
            pageIndex={pageIndex}
            canPrev={pageIndex > 0}
            canNext={inboxQuery.hasNextPage}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
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
            composing={composing}
            mode={mode}
            pendingConversationId={pendingConversationId}
            pendingMessages={socket.pendingMessages}
            onAddProjection={() => {
              setContextConversationId(selectedConversationId);
              setContextChannelId(selectedConversation?.channelId);
              openAddProjection();
            }}
            onBack={() => setSidebarOpen(true)}
            showMobileBack={Boolean(isMobile)}
            typingParticipantId={socket.typingParticipantId}
            userPhone={effectivePhone}
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

      <AddProjectionModal
        opened={addProjectionOpened}
        onClose={() => {
          closeAddProjection();
          setContextConversationId(undefined);
          setContextChannelId(undefined);
        }}
        conversationId={contextConversationId}
        defaultChannelId={contextChannelId}
      />

      <ParticipantModal
        opened={participantModalOpened}
        onClose={() => {
          closeParticipantModal();
          setContextConversationId(undefined);
        }}
        conversationId={contextConversationId}
      />

      <PhoneSetupModal opened={!effectivePhone} onSave={setChatPhone} />
    </AppShell>
  );
}

function InboxSidebar(props: {
  connected: boolean;
  conversations: ConversationInboxItem[];
  error: boolean;
  isFetchingNextPage: boolean;
  loading: boolean;
  onRetry: () => void;
  onSearch: (value: string) => void;
  onSelect: (conversation: ConversationInboxItem) => void;
  search: string;
  selectedConversationId?: string;
  mode: InboxMode;
  onModeChange: (mode: InboxMode) => void;
  status: InboxStatus | '';
  onStatusChange: (status: InboxStatus | '') => void;
  onNewChat: () => void;
  onAddParticipant: (conversationId: string) => void;
  onRemoveParticipant: (conversationId: string) => void;
  onAddMe: (conversationId: string) => void;
  pageIndex: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <Stack h="100%" gap="sm" p="sm">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
          <SegmentedControl
            data={[
              { value: 'admin', label: 'Inbox' },
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

      <Select
        allowDeselect={false}
        data={INBOX_STATUSES}
        onChange={(v) => props.onStatusChange((v || '') as InboxStatus | '')}
        size="xs"
        value={props.status}
      />

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

      <ScrollArea flex={1}>
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
        </Stack>
      </ScrollArea>

      <Group justify="space-between" mt="xs" wrap="nowrap">
        <Button
          disabled={!props.canPrev}
          onClick={props.onPrev}
          size="xs"
          variant="subtle"
        >
          Previous
        </Button>
        <Text c="dimmed" size="xs">
          Page {props.pageIndex + 1}
        </Text>
        <Button
          disabled={!props.canNext || props.isFetchingNextPage}
          leftSection={props.isFetchingNextPage ? <Loader size={12} /> : undefined}
          onClick={props.onNext}
          size="xs"
          variant="subtle"
        >
          Next
        </Button>
      </Group>
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

  const closeContextMenu = () => setContextMenuOpened(false);

  return (
    <Popover
      onChange={setContextMenuOpened}
      opened={contextMenuOpened}
      position="bottom-start"
      shadow="md"
      withinPortal
    >
      <Popover.Target>
        <Button
          color="blue"
          fullWidth
          h={76}
          justify="flex-start"
          onClick={() => {
            closeContextMenu();
            props.onSelect();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuOpened(true);
          }}
          onMouseDown={(e) => {
            if (e.button === 2) {e.preventDefault();}
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
      </Popover.Target>

      <Popover.Dropdown p={4}>
        <Stack gap={4} w={220}>
          <Button
            fullWidth
            justify="flex-start"
            leftSection={<UserPlus size={14} />}
            onClick={() => {
              closeContextMenu();
              props.onAddMe(props.conversation.conversationId);
            }}
            size="sm"
            variant="subtle"
          >
            Add Me
          </Button>
          <Button
            fullWidth
            justify="flex-start"
            leftSection={<UserPlus size={14} />}
            onClick={() => {
              closeContextMenu();
              props.onAddParticipant(props.conversation.conversationId);
            }}
            size="sm"
            variant="subtle"
          >
            Add Participant
          </Button>
          <Button
            color="red"
            fullWidth
            justify="flex-start"
            leftSection={<UserX size={14} />}
            onClick={() => {
              closeContextMenu();
              props.onRemoveParticipant(props.conversation.conversationId);
            }}
            size="sm"
            variant="subtle"
          >
            Remove Participant
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

function ConversationThread(props: {
  connected: boolean;
  conversation?: ConversationInboxItem;
  composing?: boolean;
  mode: ChatMode;
  pendingConversationId?: string;
  pendingMessages?: ExchangeMessage[];
  onAddProjection?: () => void;
  onBack: () => void;
  showMobileBack: boolean;
  typingParticipantId?: string;
  userPhone?: string;
  adminParticipantId?: string;
}) {
  const [draft, setDraft] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeMessages, setComposeMessages] = useState<ExchangeMessage[]>([]);
  const [projections, setProjections] = useState<ConversationProjection[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const pendingQuery = usePendingExchanges(props.pendingConversationId);
  const messagesQuery = useConversationMessages(props.conversation?.conversationId);
  const sendMessage = useSendConversationMessage();
  const messages = useMemo(
    () => (messagesQuery.data?.pages.flatMap((page) => page.items) ?? []).slice().reverse(),
    [messagesQuery.data],
  );
  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);
  const senderId =
    props.mode === 'admin'
      ? projections.find(p => p.isPrimary)?.participant.id
      : props.conversation?.participant.id;

  const hasMyProjection = projections.some((p) => p.participant.id === props.adminParticipantId);
  const isCompleted = props.conversation?.status === 'COMPLETED';
  const isWebChannel = props.conversation?.channelId === WEB_CHANNEL_ID;
  const inputDisabled =
    isCompleted || !isWebChannel || (!hasMyProjection && !!props.adminParticipantId);

  useEffect(() => {
    if (!props.conversation?.conversationId) {return;}
    listProjections(props.conversation.conversationId).then(setProjections).catch(() => setProjections([]));
  }, [props.conversation?.conversationId]);

  useEffect(() => {
    if (props.composing) {
      setComposeMessages([]);
    }
  }, [props.composing]);

  const sendComposeText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || composeSending) {return;}
    setComposeSending(true);

    const optimistic: ExchangeMessage = {
      id: `optimistic-${Date.now()}`,
      conversationId: props.pendingConversationId ?? 'pending',
      senderId: props.userPhone || '',
      direction: 'inbound',
      text: trimmed,
      createdAt: new Date().toISOString(),
      status: 'sent',
      optimistic: true,
    };
    setComposeMessages((prev) => [...prev, optimistic]);

    try {
      await sendWebhookMessage({
        channelId: WEB_CHANNEL_ID,
        senderPhone: props.userPhone || '',
        text: trimmed,
      });
      setDraft('');
      if (props.pendingConversationId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.pending(props.pendingConversationId) });
      }
    } catch {
      setComposeMessages((prev) =>
        prev.map((message) =>
          message.id === optimistic.id ? { ...message, status: 'failed', optimistic: false } : message
        ),
      );
    } finally {
      setComposeSending(false);
    }
  };

  const submitCompose = () => {
    if (!draft.trim() || composeSending) {return;}
    void sendComposeText(draft);
  };

  const composeThread = useMemo(() => {
    const byId = new Map<string, ExchangeMessage>();
    for (const message of pendingQuery.data?.items ?? []) {
      byId.set(message.id, message);
    }
    for (const message of props.pendingMessages ?? []) {
      if (!byId.has(message.id)) {byId.set(message.id, message);}
    }
    const merged = [...byId.values()];
    for (const message of composeMessages) {
      const duplicate = merged.some(
        (existing) =>
          existing.direction === 'inbound' &&
          existing.text === message.text &&
          Math.abs(new Date(existing.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000,
      );
      if (!duplicate) {merged.push(message);}
    }
    return [...merged].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }, [composeMessages, pendingQuery.data?.items, props.pendingMessages]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || messagesQuery.isFetchingNextPage) {return;}
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
  }, [messages.length, composeThread.length, props.conversation?.conversationId]);

  if (props.composing) {
    return (
      <Stack h="100%" gap={0}>
        <Group bg="white" justify="space-between" p="md" wrap="nowrap">
          <Group wrap="nowrap">
            {props.showMobileBack && (
              <ActionIcon aria-label="Open inbox" onClick={props.onBack} variant="subtle">
                <ArrowLeft size={18} />
              </ActionIcon>
            )}
            <Avatar radius="xl">
              <MessagesSquare size={18} />
            </Avatar>
            <Box>
              <Text fw={700} lineClamp={1}>New message</Text>
              <Text c="dimmed" size="xs">Send the first message to start a chat</Text>
            </Box>
          </Group>
        </Group>
        <ScrollArea flex={1} viewportRef={viewportRef}>
          <Stack gap="sm" p="md">
            {composeThread.length === 0 ? (
              <Center h={320}>
                <Text c="dimmed" maw={320} size="sm" ta="center">
                  Type a message below. It will create a new conversation on the web channel.
                </Text>
              </Center>
            ) : (
              composeThread.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onOptionSelect={(value) => {
                    void sendComposeText(value);
                  }}
                />
              ))
            )}
          </Stack>
        </ScrollArea>
        <Box bg="white" p="md">
          <Group align="flex-end" gap="xs" wrap="nowrap">
            <Textarea
              autosize
              maxRows={4}
              minRows={1}
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitCompose();
                }
              }}
              placeholder="Type a message..."
              style={{ flex: 1 }}
            />
            <Button
              onClick={submitCompose}
              disabled={!draft.trim() || composeSending}
              leftSection={composeSending ? <Loader size={14} /> : <Send size={14} />}
            >
              Send
            </Button>
          </Group>
        </Box>
      </Stack>
    );
  }

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
        <Group wrap="nowrap">
          {props.onAddProjection && (
            <Tooltip label="Add projection">
              <ActionIcon
                aria-label="Add projection"
                onClick={props.onAddProjection}
                size="lg"
                variant="light"
              >
                <UserPlus size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          <Badge variant="light">{conversation.status}</Badge>
        </Group>
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
