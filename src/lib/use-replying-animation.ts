import { useEffect, useMemo, useRef, useState } from 'react';

export interface ReplyingAnimationOptions<T> {
  /** Thread identity. Changing it resets the animation state. */
  key?: string | null;
  /** Returns true for messages that should animate in (i.e. incoming replies). */
  isIncoming: (message: T) => boolean;
  /** Text used to size the artificial delay (longer text = longer lag). */
  getText?: (message: T) => string;
  enabled?: boolean;
  minDelayMs?: number;
  maxDelayMs?: number;
  perCharMs?: number;
}

export interface ReplyingAnimationResult<T> {
  /** Messages with newly-arrived incoming replies withheld during the lag. */
  visible: T[];
  /** True while an incoming reply is being "typed" (withheld). */
  replying: boolean;
}

/**
 * Lags newly-arrived incoming replies behind a short, text-length-scaled delay
 * so a typing/replying indicator can be shown before the message appears.
 * Historical messages (the first population of a thread) are never delayed.
 */
export function useReplyingAnimation<T extends { id: string }>(
  messages: T[],
  options: ReplyingAnimationOptions<T>,
): ReplyingAnimationResult<T> {
  const {
    key = null,
    isIncoming,
    getText,
    enabled = true,
    minDelayMs = 500,
    maxDelayMs = 2400,
    perCharMs = 18,
  } = options;

  const [held, setHeld] = useState<Record<string, true>>({});
  const seenRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const isIncomingRef = useRef(isIncoming);
  isIncomingRef.current = isIncoming;
  const getTextRef = useRef(getText);
  getTextRef.current = getText;

  const clearTimers = () => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }
    timersRef.current = [];
  };

  // Reset whenever the active thread changes.
  useEffect(() => {
    clearTimers();
    seenRef.current = new Set();
    initializedRef.current = false;
    setHeld({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const incoming = messages.filter(
      (message) => isIncomingRef.current(message) && !seenRef.current.has(message.id),
    );

    // First population of a thread is history — show it immediately.
    if (!initializedRef.current) {
      for (const message of messages) {
        seenRef.current.add(message.id);
      }
      if (messages.length > 0) {
        initializedRef.current = true;
      }
      return;
    }

    if (incoming.length === 0) {
      for (const message of messages) {
        seenRef.current.add(message.id);
      }
      return;
    }

    const toHold: Record<string, true> = {};
    let cumulative = 0;
    for (const message of incoming) {
      seenRef.current.add(message.id);
      toHold[message.id] = true;
      const text = getTextRef.current?.(message) ?? '';
      const delay = Math.min(
        maxDelayMs,
        Math.max(minDelayMs, Math.floor(text.length * perCharMs)),
      );
      cumulative += delay;
      const messageId = message.id;
      const timer = setTimeout(() => {
        setHeld((prev) => {
          if (!prev[messageId]) {
            return prev;
          }
          const next = { ...prev };
          delete next[messageId];
          return next;
        });
      }, cumulative);
      timersRef.current.push(timer);
    }
    for (const message of messages) {
      seenRef.current.add(message.id);
    }
    setHeld((prev) => ({ ...prev, ...toHold }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, enabled, minDelayMs, maxDelayMs, perCharMs]);

  useEffect(() => clearTimers, []);

  const visible = useMemo(
    () => messages.filter((message) => !held[message.id]),
    [messages, held],
  );

  return { visible, replying: Object.keys(held).length > 0 };
}
