import { Box, Group } from '@mantine/core';
import type { CSSProperties } from 'react';

const KEYFRAMES = `@keyframes rxTypingDot{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}`;

/** Three bouncing dots used as a "replying/writing" indicator. */
export function TypingDots({ color = '#16A34A' }: { color?: string }) {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <output
        aria-label="Replying"
        style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: color,
              display: 'inline-block',
              animation: 'rxTypingDot 1.2s infinite ease-in-out',
              animationDelay: `${index * 0.16}s`,
            }}
          />
        ))}
      </output>
    </>
  );
}

/** A chat-bubble-shaped typing indicator. */
export function TypingBubble({
  background = '#F7FBF9',
  color = '#16A34A',
  align = 'flex-start',
  style,
}: {
  background?: string;
  color?: string;
  align?: 'flex-start' | 'flex-end';
  style?: CSSProperties;
}) {
  return (
    <Box
      px="sm"
      py={10}
      style={{
        alignSelf: align,
        background,
        borderRadius: 14,
        borderBottomLeftRadius: 4,
        display: 'inline-flex',
        ...style,
      }}
    >
      <Group gap={6} wrap="nowrap" align="center">
        <TypingDots color={color} />
      </Group>
    </Box>
  );
}
