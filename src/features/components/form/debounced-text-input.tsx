import { TextInput, Textarea } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '../utils';

type Props = {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  isTextarea?: boolean;
  [key: string]: any;
};

export function DebouncedTextInput({
  value,
  onChange,
  debounceMs = 300,
  isTextarea = false,
  ...props
}: Props) {
  const [localValue, setLocalValue] = useState(value);
  const focusRef = useRef(false);
  const debouncedValue = useDebouncedValue(localValue, debounceMs);

  // Update local value when prop changes (from parent), but never while typing
  useEffect(() => {
    if (!focusRef.current && value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  // Call onChange only for debounced value
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue]);

  const Component = isTextarea ? Textarea : TextInput;

  return (
    <Component
      {...props}
      value={localValue}
      onFocus={(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        focusRef.current = true;
        props.onFocus?.(event);
      }}
      onBlur={(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        focusRef.current = false;
        if (localValue !== value) {
          onChange(localValue);
        }
        props.onBlur?.(event);
      }}
      onChange={(e) => setLocalValue(e.currentTarget.value)}
    />
  );
}
