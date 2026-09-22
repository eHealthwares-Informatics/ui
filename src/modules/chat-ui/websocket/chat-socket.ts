import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/auth-tokens';
import { CONVERSATION_API_BASE_URL } from '@/lib/conversation-api';

let socket: Socket | null = null;

type SocketIdentity = {
  phone?: string;
  guest?: boolean;
};

let identity: SocketIdentity = {};

/**
 * Set the phone/guest identity the next socket connection should present.
 * A change tears down the existing socket so the next getConversationSocket()
 * reconnects with the new handshake auth (rooms are joined on connect).
 */
export function setConversationIdentity(next: SocketIdentity): void {
  const changed = next.phone !== identity.phone || next.guest !== identity.guest;
  identity = next;
  if (changed) {
    resetConversationSocket();
  }
}

export function getConversationSocket(): Socket {
  if (socket) {
    return socket;
  }

  const socketUrl =
    (import.meta.env.VITE_CONVERSATION_SOCKET_URL as string | undefined) ??
    CONVERSATION_API_BASE_URL.replace(/\/api\/?$/, '');

  socket = io(`${socketUrl}/conversations`, {
    transports: ['websocket'],
    auth: {
      token: getAccessToken(),
      phone: identity.phone,
      guest: identity.guest ?? false,
    },
  });

  return socket;
}

export function resetConversationSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
