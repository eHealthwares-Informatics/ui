import { useState, useEffect, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { conversationApi, CONVERSATION_API_BASE_URL } from '@/lib/conversation-api';
import { getAccessToken } from '@/lib/auth-tokens';

const ANON_PHONE_KEY = 'damorex-chatbot-phone';
const WEB_CHANNEL_ID = '69bd061c11bf835d976c4e2f';

let cachedAnonPhone: string | null = localStorage.getItem(ANON_PHONE_KEY);

function ensurePhone(phone: string): string {
  if (phone) {return phone;}
  if (cachedAnonPhone) {return cachedAnonPhone;}
  cachedAnonPhone = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(ANON_PHONE_KEY, cachedAnonPhone);
  return cachedAnonPhone;
}

interface ChatMessage {
  id: string;
  text: string;
  role: 'user' | 'bot';
  createdAt: string;
}

let chatbotSocket: Socket | null = null;

function getChatbotSocket(): Socket {
  if (chatbotSocket) {return chatbotSocket;}

  const socketUrl =
    (import.meta.env.VITE_CONVERSATION_SOCKET_URL as string | undefined) ??
    CONVERSATION_API_BASE_URL.replace(/\/api\/?$/, '');

  chatbotSocket = io(`${socketUrl}/conversations`, {
    transports: ['websocket'],
    auth: { token: getAccessToken() },
  });

  return chatbotSocket;
}

export function useChatbotSession(senderPhone: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const phoneRef = useRef(ensurePhone(senderPhone));
  const conversationIdRef = useRef<string | null>(null);
  phoneRef.current = ensurePhone(senderPhone);

  useEffect(() => {
    const socket = getChatbotSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onMessage = (msg: { id: string; text: string; conversationId?: string; senderId?: string; createdAt: string; direction: string }) => {
      if (!conversationIdRef.current && msg.conversationId) {
        conversationIdRef.current = msg.conversationId;
      } else if (conversationIdRef.current?.startsWith('pending-') && msg.conversationId && !msg.conversationId.startsWith('pending-')) {
        conversationIdRef.current = msg.conversationId;
      }

      if (conversationIdRef.current && msg.conversationId !== conversationIdRef.current) {return;}

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.id);
        if (exists) {return prev;}
        return [...prev, { id: msg.id, text: msg.text, role: 'bot', createdAt: msg.createdAt }];
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('conversation.message.created', onMessage);

    setConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('conversation.message.created', onMessage);
    };
  }, []);

  useEffect(() => {
    const socket = getChatbotSocket();
    const convId = conversationIdRef.current;
    if (!convId) {return;}

    socket.emit('conversation.opened', { conversationId: convId });

    return () => {
      socket.emit('conversation.closed', { conversationId: convId });
    };
  }, []);

  const send = useCallback(
    async (text: string, questionnaireCode?: string) => {
      const phone = ensurePhone(phoneRef.current);
      if (!phone || sending) {return;}

      const optimisticId = `opt-${Date.now()}`;
      const createdAt = new Date().toISOString();

      setMessages((prev) => [
        ...prev,
        { id: optimisticId, text, role: 'user', createdAt },
      ]);

      setSending(true);
      try {
        const body: Record<string, any> = {
          channelId: WEB_CHANNEL_ID,
          senderPhone: phone,
          text,
        };
        if (questionnaireCode) {body.questionnaireCode = questionnaireCode;}
        if (conversationIdRef.current) {body.conversationId = conversationIdRef.current;}

        await conversationApi.post('/webhooks/web', body);
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } finally {
        setSending(false);
      }
    },
    [sending],
  );

  const clear = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = null;
  }, []);

  return { messages, connected, sending, send, clear };
}
