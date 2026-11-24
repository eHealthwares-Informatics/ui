import { useCallback, useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/auth-tokens';
import { CONVERSATION_API_BASE_URL } from '@/lib/conversation-api';
import {
  CallClient,
  IDLE_CALL,
  type CallAuth,
  type CallState,
  type CallStreams,
} from './call-client';

/** Socket origin for the conversation engine (same host as the REST API). */
export function conversationSocketUrl(): string {
  const configured = import.meta.env.VITE_CONVERSATION_SOCKET_URL as string | undefined;
  return configured ?? CONVERSATION_API_BASE_URL.replace(/\/api\/?$/, '');
}

export type UseCallOptions = {
  /** Guest identity for the `/calls` handshake (defaults to the JWT). */
  phone?: string;
  guest?: boolean;
};

/**
 * React binding for `CallClient`. Safe to mount anywhere: it opens no media
 * and no socket until `start(callId)` is called, so the same hook powers a
 * chat control and a standalone call button.
 */
export function useCall(options: UseCallOptions = {}) {
  const [state, setState] = useState<CallState>(IDLE_CALL);
  const [streams, setStreams] = useState<CallStreams>({
    local: null,
    remote: null,
  });
  const clientRef = useRef<CallClient | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const start = useCallback((callId: string, options?: { audioOnly?: boolean }) => {
    clientRef.current?.dispose();
    const token = getAccessToken();
    const auth: CallAuth = {
      token,
      phone: optionsRef.current.phone,
      guest: optionsRef.current.guest ?? !token,
    };
    const client = new CallClient({
      socketUrl: conversationSocketUrl(),
      auth,
      onChange: (next, nextStreams) => {
        setState(next);
        setStreams(nextStreams);
      },
    });
    clientRef.current = client;
    void client.start(callId, options);
  }, []);

  const leave = useCallback(() => {
    clientRef.current?.leave();
  }, []);

  const toggleMute = useCallback(() => {
    clientRef.current?.toggleMute();
  }, []);

  const toggleCamera = useCallback(() => {
    clientRef.current?.toggleCamera();
  }, []);

  /** Clear the ended/error state so the button is ready for another call. */
  const reset = useCallback(() => {
    clientRef.current?.dispose();
    clientRef.current = null;
    setState(IDLE_CALL);
    setStreams({ local: null, remote: null });
  }, []);

  useEffect(
    () => () => {
      clientRef.current?.dispose();
      clientRef.current = null;
    },
    []
  );

  const active =
    state.status === 'connecting' ||
    state.status === 'waiting' ||
    state.status === 'connecting-peer' ||
    state.status === 'connected' ||
    state.status === 'reconnecting';

  return {
    ...state,
    active,
    localStream: streams.local,
    remoteStream: streams.remote,
    start,
    leave,
    toggleMute,
    toggleCamera,
    reset,
  };
}
