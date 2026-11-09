import { Select } from '@mantine/core';
import { Option } from '@/features/rxsoft/types';

type SelectFieldProps = {
  value: Option | null;
  options: Option[];
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
};

export function SelectField({
  value,
  options,
  onChange,
  placeholder,
  label,
  className,
  disabled,
  error,
  onBlur,
  onFocus,
  testId,
}: SelectFieldProps) {
  return (
    <Select
      data-testid={testId}
      label={label}
      className={className}
      value={value?.value as string}
      onChange={(value, option) => {
        onChange(option);
      }}
      data={options}
      placeholder={placeholder}
      disabled={disabled}
      clearable
      searchable={false}
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
