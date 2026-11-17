import { Badge, Button, Text, Textarea, Box, Flex, useMantineTheme, rem } from '@mantine/core';
import { useEffect, useMemo, useState, useRef } from 'react';

type JsonEditorFieldProps = {
  value: unknown;
  onChange: (value: any) => void;
  label?: string;
  helpText?: string;
  placeholder?: string;
  minRows?: number;
  error?: string;
  'data-testid'?: string;
};

function formatJson(value: unknown) {
  if (value == null || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

export function JsonEditorField({
  value,
  onChange,
  label,
  helpText,
  placeholder = '{\n  "key": "value"\n}',
  minRows = 8,
  error,
  'data-testid': testId,
}: JsonEditorFieldProps) {
  const [text, setText] = useState(() => formatJson(value));
  const [focused, setFocused] = useState(false);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const theme = useMantineTheme();

  const inputTestId = testId ? `${testId}-input` : 'json-editor-input';
  const formatTestId = testId ? `${testId}-format` : 'json-editor-format';
  const errorTestId = testId ? `${testId}-error` : 'json-editor-error';

  const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  };

  useEffect(() => {
    setText(formatJson(value));
  }, [value]);

  const parseState = useMemo(() => {
    if (!text.trim()) {
      return { valid: true, message: 'Empty JSON', data: undefined as unknown };
    }
    try {
      const parsed = JSON.parse(text);
      return { valid: true, message: 'Valid JSON', data: parsed as unknown };
    } catch (parseError) {
      return {
        valid: false,
        message: parseError instanceof Error ? parseError.message : 'Invalid JSON',
        data: undefined as unknown,
      };
    }
  }, [text]);

  const handleFormat = () => {
    if (parseState.valid && parseState.data) {
      const formatted = JSON.stringify(parseState.data, null, 2);
      setText(formatted);
      onChange(parseState.data);
    }
  };

  const handleChange = (val: string) => {
    setText(val);
    try {
      onChange(JSON.parse(val));
    } catch {
      // Keep the previous value while the user is mid-type; the red badge and
      // submit-time validation surface the problem.
    }
  };

  const lines = text.split('\n');

  // Shared typography constants for perfect alignment.
  const lineHeight = 1.6;
  const fontSize = theme.fontSizes.sm;
  const paddingVertical = theme.spacing.xs;

  const sharedStyles: React.CSSProperties = {
    fontFamily: theme.fontFamilyMonospace,
    fontSize,
    lineHeight,
    paddingTop: paddingVertical,
    paddingBottom: paddingVertical,
  };

  return (
    <Box data-testid={testId}>
      {label && (
        <Text size="sm" fw={500} mb={4}>
          {label}
        </Text>
      )}

      <Flex
        direction="row"
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => setFocused(false)}
        style={{
          border: `${rem(1)} solid ${
            focused ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-gray-3)'
          }`,
          borderRadius: theme.radius.sm,
          overflow: 'hidden',
          backgroundColor: 'var(--mantine-color-white)',
          transition: 'border-color 120ms ease',
        }}
      >
        {/* Line Numbers */}
        <Box
          ref={lineNumbersRef}
          aria-hidden
          style={{
            ...sharedStyles,
            backgroundColor: 'var(--mantine-color-gray-0)',
            color: 'var(--mantine-color-gray-5)',
            textAlign: 'right',
            paddingLeft: theme.spacing.sm,
            paddingRight: theme.spacing.sm,
            borderRight: `${rem(1)} solid var(--mantine-color-gray-3)`,
            userSelect: 'none',
            overflow: 'hidden',
            whiteSpace: 'pre',
          }}
        >
          {lines.map((_, i) => (
            <div key={i} style={{ height: `calc(${lineHeight} * ${fontSize})` }}>
              {i + 1}
            </div>
          ))}
        </Box>

        {/* Editor Area */}
        <Textarea
          data-testid={inputTestId}
          value={text}
          onChange={(e) => handleChange(e.currentTarget.value)}
          onScroll={handleScroll}
          placeholder={placeholder}
          aria-label={label ?? 'JSON editor'}
          variant="unstyled"
          autosize
          minRows={minRows}
          style={{ flex: 1 }}
          styles={{
            root: { flex: 1, display: 'flex', flexDirection: 'column' },
            wrapper: { flex: 1, display: 'flex', flexDirection: 'column' },
            input: {
              ...sharedStyles,
              paddingLeft: theme.spacing.sm,
              paddingRight: theme.spacing.sm,
              flex: 1,
              resize: 'none',
            },
          }}
        />
      </Flex>

      <Flex align="center" justify="space-between" mt="xs" gap="sm">
        <Badge color={parseState.valid ? 'green' : 'red'} variant="dot" size="sm" tt="none">
          {parseState.message}
        </Badge>
        <Button
          data-testid={formatTestId}
          size="xs"
          variant="light"
          onClick={handleFormat}
          disabled={!parseState.valid || !parseState.data}
        >
          Format JSON
        </Button>
      </Flex>

      {error && (
        <Text size="xs" c="red" mt={4} data-testid={errorTestId}>
          {error}
        </Text>
      )}

      {helpText && (
        <Text size="xs" c="dimmed" mt={4}>
          {helpText}
        </Text>
      )}
    </Box>
  );
}
