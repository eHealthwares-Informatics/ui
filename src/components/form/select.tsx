import { Select } from '@mantine/core';
import { useEffect } from 'react';
import { Option } from '@/features/rxsoft/types';

type SelectFieldProps = {
  value: Option | null;
  options?: Option[];
  /**
   * Options derived from the live form state (dependent selects). Takes
   * precedence over `options`; when set, a value that is no longer in the
   * list is cleared so a stale selection can't be submitted.
   */
  optionsFor?: (formState: Record<string, unknown>) => Option[];
  formState?: Record<string, unknown>;
  onChange: (option: Option | null) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  /**
   * Base testid for the control. The input gets `data-testid={testId}` and each
   * option renders as `${testId}-option-${value}` (ui#10). Previously the
   * `data-testid` prop was dropped entirely — custom components do not forward
   * unknown props the way Mantine inputs do — so static selects had no testid.
   */
  testId?: string;
  /** Type-ahead filtering (autocomplete behaviour). */
  searchable?: boolean;
};

export function SelectField({
  value: selectedValue,
  options,
  optionsFor,
  formState,
  onChange,
  placeholder,
  label,
  className,
  disabled,
  error,
  onBlur,
  onFocus,
  testId,
  searchable = false,
}: SelectFieldProps) {
  const resolvedOptions = optionsFor ? optionsFor(formState ?? {}) : (options ?? []);
  const selectionValid =
    !selectedValue || resolvedOptions.some((option) => option.value === selectedValue.value);

  useEffect(() => {
    // Only clear when the dependent list is actually populated; while the
    // reference data is still loading, keep the stored selection.
    if (optionsFor && resolvedOptions.length > 0 && selectedValue && !selectionValid) {
      onChange(null);
    }
  }, [optionsFor, resolvedOptions.length, selectedValue, selectionValid, onChange]);

  return (
    <Select
      data-testid={testId}
      label={label}
      className={className}
      value={optionsFor && !selectionValid ? null : ((selectedValue?.value as string) ?? null)}
      onChange={(value, option) => {
        onChange(option);
      }}
      data={resolvedOptions}
      placeholder={placeholder}
      disabled={disabled}
      clearable
      searchable={searchable}
      error={error}
      onBlur={onBlur}
      onFocus={onFocus}
      renderOption={({ option }) => (
        <div data-testid={testId ? `${testId}-option-${option.value}` : undefined}>
          {option.label}
        </div>
      )}
    />
  );
}
