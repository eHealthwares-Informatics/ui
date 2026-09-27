import { TextInput, Paper, Stack, UnstyledButton, Select } from '@mantine/core';
import { QueryKey, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApiProvider } from '@/context/module-context';
import { Field, Option } from '@/features/rxsoft/types';
import { modules } from '../../shared';
import { getArrayPayload, mapOption, useDebouncedValue } from '../utils';

function RemoteSelectField({
  field,
  value,
  onChange,
  error,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  onFocus?: (value: string) => void;
  error?: string;
}) {
  const apiClient = useApiProvider();
  const {
    endpoint,
    queryParam = 'q',
    placeholder = 'Search...',
    debounceMs = 300,
    minChars = 2,
    staticParams,
    valueKey,
    labelKey,
  } = field.searchParam!;

  const [inputValue, setInputValue] = useState(value);
  const [showOptions, setShowOptions] = useState(false);

  const debouncedInput = useDebouncedValue(inputValue, debounceMs);
  const canSearch = debouncedInput.trim().length >= minChars;

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const query = useQuery({
    queryKey: ['rxsoft-search-control', endpoint, debouncedInput, staticParams] satisfies QueryKey,
    queryFn: async () => {
      if (!endpoint) {
        return [] as Option[];
      }

      const response = await apiClient.get(endpoint, {
        params: {
          ...(staticParams ?? {}),
          [queryParam]: debouncedInput,
        },
      });

      return getArrayPayload(response.data)
        .map((item) => mapOption(item, valueKey, labelKey))
        .filter((item): item is Option => item !== null);
    },
    enabled: Boolean(endpoint) && canSearch,
    staleTime: 30_000,
  });

  return (
    <div className="relative">
      <TextInput
        value={inputValue}
        placeholder={placeholder}
        leftSection={<Search size={16} />}
        onFocus={() => setShowOptions(true)}
        onBlur={() => {
          window.setTimeout(() => setShowOptions(false), 150);
        }}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          setInputValue(nextValue);
          onChange(nextValue);
        }}
        error={error}
      />

      {showOptions && (query.data?.length ?? 0) > 0 ? (
        <Paper
          shadow="sm"
          radius="md"
          withBorder
          className="absolute top-[calc(100%+0.35rem)] z-30 max-h-60 w-full overflow-y-auto"
          p="xs"
        >
          <Stack gap={4}>
            {(query.data ?? []).map((option) => (
              <UnstyledButton
                key={option.value}
                className="w-full rounded-md px-2 py-2 text-left hover:bg-gray-100 dark:hover:bg-dark-5"
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  setInputValue(option.label);
                  onChange(option.label);
                  setShowOptions(false);
                }}
              >
                {option.label}
              </UnstyledButton>
            ))}
          </Stack>
        </Paper>
      ) : null}
    </div>
  );
}

export { RemoteSelectField };
