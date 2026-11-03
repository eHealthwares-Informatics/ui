import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import {
  assistantStorageKey,
  clearStoredConversationId,
  connectAssistantSocket,
  discoverPatientEnquiryConversation,
  fetchAssistantThread,
  readStoredConversationId,
  sendAssistantMessage,
  startPatientEnquiry,
  storeConversationId,
  type AssistantIdentity,
  type AssistantMessage,
} from '../../lib/patient-assistant-service';

type UsePatientAssistantInput = {
  patientMrn: string;
  open: boolean;
};

type SocketMessagePayload = {
  conversationId?: string;
  newConversationId?: string;
  oldConversationId?: string;
  participantId?: string;
};

function botCount(messages: AssistantMessage[]): number {
  return messages.filter((message) => message.role === 'bot').length;
}

export function usePatientAssistant({
  patientMrn,
  open,
}: UsePatientAssistantInput) {
  const user = useAuthStore((state) => state.user);
  const identity: AssistantIdentity | null = useMemo(
    () =>
      user
        ? { userId: user.id, email: user.email, phone: user.phone }
        : null,
    [user]
  );
  const storageKey = identity
    ? assistantStorageKey(identity.userId, patientMrn)
    : null;

  const [conversationId, setConversationIdState] = useState<string | null>(
    () => (storageKey ? readStoredConversationId(storageKey) : null)
  );
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const participantIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(conversationId);
  const messagesRef = useRef<AssistantMessage[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingStartedAtRef = useRef(0);

  conversationIdRef.current = conversationId;
  messagesRef.current = messages;
  participantIdRef.current = participantId;

  const setConversationId = useCallback(
    (id: string | null) => {
      conversationIdRef.current = id;
      setConversationIdState(id);
      if (storageKey && id) storeConversationId(storageKey, id);
      if (storageKey && !id) clearStoredConversationId(storageKey);
    },
    [storageKey]
  );

  const loadThread = useCallback(async (id: string) => {
    const thread = await fetchAssistantThread(id);
    setMessages(thread);
    return thread;
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollForReply = useCallback(
    (id: string, previousBotCount: number) => {
      stopPolling();
      const startedAt = Date.now();
      pollTimerRef.current = setInterval(async () => {
        if (Date.now() - startedAt > 45_000) {
          stopPolling();
          setThinking(false);
          return;
        }
        try {
          const thread = await loadThread(id);
          if (botCount(thread) > previousBotCount) {
            setThinking(false);
            stopPolling();
          }
        } catch {
          /* transient — keep polling until the budget expires */
        }
      }, 1_500);
    },
    [loadThread, stopPolling]
  );

  const adoptConversation = useCallback(
    async (id: string) => {
      setConversationId(id);
      await loadThread(id);
      const previousBotCount = botCount(messagesRef.current);
      pollForReply(id, previousBotCount);
    },
    [loadThread, pollForReply, setConversationId]
  );

  const start = useCallback(async () => {
    if (started || !identity) return;
    setStarted(true);
    setError(null);
    setEnded(false);
    setSending(true);
    setThinking(true);
    pendingStartedAtRef.current = Date.now();
    try {
      const response = await startPatientEnquiry({
        patientMrn,
        identity,
      });
      if (response.participantId) {
        setParticipantId(response.participantId);
        participantIdRef.current = response.participantId;
      }
      if (response.conversationId) {
        setConversationId(response.conversationId);
        if (!response.conversationId.startsWith('pending-')) {
          await loadThread(response.conversationId);
        }
        pollForReply(response.conversationId, 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start the assistant.');
      setThinking(false);
      setStarted(false);
    } finally {
      setSending(false);
    }
  }, [identity, loadThread, patientMrn, pollForReply, setConversationId, started]);

  const send = useCallback(
    async (text: string) => {
      const value = text.trim();
      if (!value || !identity) return;
      setError(null);
      setSending(true);
      setThinking(true);
      const optimistic: AssistantMessage = {
        id: `optimistic-${Date.now()}`,
        role: 'user',
        text: value,
        createdAt: new Date().toISOString(),
        optimistic: true,
      };
      setMessages((current) => [...current, optimistic]);
      const previousBotCount = botCount(messagesRef.current);

      try {
        if (!started) {
          setStarted(true);
          const startResponse = await startPatientEnquiry({
            patientMrn,
            identity,
          });
          if (startResponse.participantId) {
            setParticipantId(startResponse.participantId);
            participantIdRef.current = startResponse.participantId;
          }
          if (startResponse.conversationId) {
            setConversationId(startResponse.conversationId);
            if (startResponse.conversationId.startsWith('pending-')) {
              pendingStartedAtRef.current = Date.now();
            }
          }
        }

        const currentId = conversationIdRef.current;
        const response = await sendAssistantMessage({
          conversationId: currentId ?? undefined,
          text: value,
          identity,
        });
        if (response.participantId) {
          setParticipantId(response.participantId);
          participantIdRef.current = response.participantId;
        }
        if (response.conversationId && response.conversationId !== currentId) {
          setConversationId(response.conversationId);
        }
        const id = response.conversationId ?? currentId;
        if (id && !id.startsWith('pending-')) {
          await loadThread(id);
          pollForReply(id, previousBotCount);
        } else if (id) {
          pollForReply(id, previousBotCount);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to send your message.'
        );
        setThinking(false);
        setMessages((current) =>
          current.filter((message) => message.id !== optimistic.id)
        );
      } finally {
        setSending(false);
      }
    },
    [
      identity,
      loadThread,
      patientMrn,
      pollForReply,
      setConversationId,
      started,
    ]
  );

  const reset = useCallback(() => {
    stopPolling();
    setConversationId(null);
    setMessages([]);
    setStarted(false);
    setEnded(false);
    setThinking(false);
    setError(null);
    setParticipantId(null);
    participantIdRef.current = null;
  }, [setConversationId, stopPolling]);

  // Connect once per patient/user; the gateway resolves the participant from
  // the JWT and auto-joins the conversation rooms.
  useEffect(() => {
    if (!identity || !open) return;
    const socket = connectAssistantSocket();
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('conversation.created', (payload: SocketMessagePayload) => {
      const next = payload.newConversationId;
      if (!next) return;
      const matchesPending =
        Boolean(payload.oldConversationId) &&
        payload.oldConversationId === conversationIdRef.current;
      const matchesParticipant =
        Boolean(payload.participantId) &&
        payload.participantId === participantIdRef.current;
      if (!matchesPending && !matchesParticipant) return;
      setConversationId(next);
      void loadThread(next);
    });
    socket.on('conversation.message.created', (payload: SocketMessagePayload) => {
      const id = conversationIdRef.current ?? payload.conversationId;
      if (!id || id.startsWith('pending-')) return;
      void loadThread(id).then((thread) => {
        if (botCount(thread) > 0) setThinking(false);
      });
    });
    socket.on('conversation.ended', () => setEnded(true));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [identity, loadThread, open, setConversationId]);

  // Discover the real conversation id when the webhook returned a pending id
  // (or the creation event was missed).
  useEffect(() => {
    if (!open || !started) return;
    const id = conversationId;
    if (!id?.startsWith('pending-') && id) return;
    const pendingParticipantId = id?.replace('pending-', '');
    if (!pendingParticipantId) return;

    const timer = setInterval(async () => {
      const found = await discoverPatientEnquiryConversation(
        pendingParticipantId,
        pendingStartedAtRef.current
      );
      if (found && found !== conversationId) {
        await adoptConversation(found);
      }
    }, 2_000);
    return () => clearInterval(timer);
  }, [adoptConversation, conversationId, open, started]);

  // Start automatically the first time the panel is opened, or load the
  // persisted thread when one exists.
  useEffect(() => {
    if (!open || !identity) return;
    if (conversationId && !conversationId.startsWith('pending-')) {
      setStarted(true);
      void loadThread(conversationId);
      return;
    }
    if (!started) {
      void start();
    }
  }, [conversationId, identity, loadThread, open, start, started]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return {
    messages,
    sending,
    thinking,
    connected,
    ended,
    error,
    started,
    conversationId,
    send,
    start,
    reset,
  };
}
