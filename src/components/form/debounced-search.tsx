import { Input } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '../utils';

type DebouncedInputProps = {
  onChange: (value: string) => void;
  minChars?: number;
  debounceMs?: number;
};
export function DebouncedInput({ minChars, onChange, debounceMs = 300 }: DebouncedInputProps) {
  const [debouncedValue, setDebouncedValue] = useState('');
  const debouncedInput = useDebouncedValue(debouncedValue, debounceMs ?? 300);

  const handleChange = (e: any) => {
    setDebouncedValue(e.target.value);
  };

  useEffect(() => {
    if (debouncedInput.trim().length >= (minChars ?? 2) || debouncedInput.trim().length === 0) {
      onChange(debouncedInput);
    }
  }, [debouncedInput]);

  return <Input onChange={handleChange} />;
}
