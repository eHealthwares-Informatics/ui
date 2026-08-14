import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type {
  ConversationInboxResponse,
  ExchangeMessage,
  ExchangeMessagesResponse,
} from '../types';
import { getConversationSocket } from '../websocket/chat-socket';
import { chatKeys } from './use-chat-queries';

export function useChatSocket(input: {
  conversationId?: string;
  participantId?: string;
  pendingConversationId?: string;
  pendingParticipantId?: string;
  onConversationCreated?: (conversationId: string) => void;
}) {
  const {
    conversationId,
    participantId,
    pendingConversationId,
    pendingParticipantId,
    onConversationCreated,
  } = input;
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [typingParticipantId, setTypingParticipantId] = useState<string>();
  const [pendingMessages, setPendingMessages] = useState<ExchangeMessage[]>([]);

  const onConversationCreatedRef = useRef(onConversationCreated);
  onConversationCreatedRef.current = onConversationCreated;

  const roomPayloadRef = useRef<{ conversationId?: string; participantId?: string }>({});
  roomPayloadRef.current =
    conversationId && participantId ? { conversationId, participantId } : {};
  const pendingRoomPayloadRef = useRef<{ conversationId?: string; participantId?: string }>({});
  pendingRoomPayloadRef.current =
    pendingConversationId && pendingParticipantId
      ? { conversationId: pendingConversationId, participantId: pendingParticipantId }
      : {};

  useEffect(() => {
    const socket = getConversationSocket();

    const onConnect = () => {
      setConnected(true);
      // socket.io reconnects automatically but room membership is not restored,
      // so re-join the rooms for the selected conversation and the pending
      // compose conversation on every (re)connect.
      if (roomPayloadRef.current.conversationId) {
        socket.emit('conversation.opened', roomPayloadRef.current);
      }
      if (pendingRoomPayloadRef.current.conversationId) {
        socket.emit('conversation.opened', pendingRoomPayloadRef.current);
      }
    };
    const onDisconnect = () => setConnected(false);
    const onMessage = (message: ExchangeMessage) => {
      if (!message.conversationId) {return;}

      // Messages routed through a "pending-" conversation id belong to the
      // compose thread (no real conversation exists yet). Surface them there
      // until a real conversation is created and the pending is backfilled.
      if (message.conversationId.startsWith('pending-')) {
        setPendingMessages((prev) =>
          prev.some((item) => item.id === message.id) ? prev : [...prev, message]
        );
        return;
      }

      queryClient.setQueryData<{
        pages: ExchangeMessagesResponse[];
        pageParams: Array<string | undefined>;
      }>(chatKeys.messages(message.conversationId), (current) => {
        if (!current) {return current;}
        const exists = current.pages.some((page) =>
          page.items.some((item) => item.id === message.id)
        );
        if (exists) {return current;}

        const [firstPage, ...restPages] = current.pages;
        return {
          ...current,
          pages: [{ ...firstPage, items: [message, ...firstPage.items] }, ...restPages],
        };
      });

      queryClient.invalidateQueries({ queryKey: ['conversation-inbox'] });
      onConversationCreatedRef.current?.(message.conversationId);
    };
    const onUpdated = (payload?: { conversationId?: string }) => {
      if (payload?.conversationId?.startsWith('pending-')) {
        // No real conversation exists yet; keep the compose thread fresh by
        // refetching the pending exchanges (socket message event may have been
        // missed if the client joined the pending room late).
        if (payload.conversationId) {
          queryClient.invalidateQueries({ queryKey: chatKeys.pending(payload.conversationId) });
        }
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['conversation-inbox'] });
      if (payload?.conversationId) {
        onConversationCreatedRef.current?.(payload.conversationId);
      }
    };
    const onTypingStarted = (payload: { participantId?: string }) => {
      setTypingParticipantId(payload.participantId);
    };
    const onTypingStopped = () => setTypingParticipantId(undefined);
    const onRead = (payload: { conversationId: string }) => {
      queryClient.setQueriesData<{
        pages: ConversationInboxResponse[];
        pageParams: Array<string | undefined>;
      }>({ queryKey: ['conversation-inbox'] }, (current) => {
        if (!current) {return current;}
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.conversationId === payload.conversationId ? { ...item, unreadCount: 0 } : item
            ),
          })),
        };
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('conversation.message.created', onMessage);
    socket.on('conversation.updated', onUpdated);
    socket.on('conversation.read', onRead);
    socket.on('typing.started', onTypingStarted);
    socket.on('typing.stopped', onTypingStopped);

    setConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('conversation.message.created', onMessage);
      socket.off('conversation.updated', onUpdated);
      socket.off('conversation.read', onRead);
      socket.off('typing.started', onTypingStarted);
      socket.off('typing.stopped', onTypingStopped);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!conversationId || !participantId) {return;}

    const socket = getConversationSocket();
    const payload = {
      conversationId,
      participantId,
    };
    socket.emit('conversation.opened', payload);

    return () => {
      socket.emit('conversation.closed', payload);
    };
  }, [conversationId, participantId]);

  useEffect(() => {
    if (!pendingConversationId || !pendingParticipantId) {return;}

    const socket = getConversationSocket();
    const payload = {
      conversationId: pendingConversationId,
      participantId: pendingParticipantId,
    };
    socket.emit('conversation.opened', payload);

    return () => {
      socket.emit('conversation.closed', payload);
    };
  }, [pendingConversationId, pendingParticipantId]);

  useEffect(() => {
    if (!pendingConversationId) {
      setPendingMessages([]);
    }
  }, [pendingConversationId]);

  return { connected, typingParticipantId, pendingMessages };
}
