import { Combobox, Group, InputBase, Text, useCombobox } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useApiProvider } from '@/context/module-context';
import { Field, Option } from '@/features/rxsoft/types';
import { useDebouncedValue, getArrayPayload, mapOption } from '../utils';
import { SelectField } from './select';

type Props = {
  value: Option | null;
  field: Field;
  onChange: (option: Option | null) => void;
  disabled?: boolean;
  error?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  formState?: Record<string, unknown>;
  /** Clears the input and keeps the dropdown open after selecting (multi-select mode) */
  clearAfterSelect?: boolean;
  /** Option values that are currently selected (renders a check mark on dropdown rows) */
  selectedValues?: string[];
};

const STATIC_SELECT_THRESHOLD = 50;

export function AsyncSelectField({
  value,
  field,
  onChange,
  disabled = false,
  error,
  formState,
  clearAfterSelect = false,
  selectedValues,
  ...props
}: Props) {
  const apiProvider = useApiProvider();
  const combobox = useCombobox();

  const [inputValue, setInputValue] = useState(value?.label || '');
  const [isStaticSelect, setIsStaticSelect] = useState(false);

  const debouncedInput = useDebouncedValue(inputValue, 300);

  // const shouldSearch =
  //   debouncedInput === '' || debouncedInput.trim().length >= (field.searchParam?.minChars || 2);

  const mapToOption = (item: unknown): Option | null =>
    mapOption(item, field.searchParam?.valueKey, field.searchParam?.labelKey);
  const selectQuery = useQuery({
    queryKey: ['async-select', field.searchParam?.endpoint, debouncedInput, value?.value],

    queryFn: async () => {
      if (!field.searchParam?.endpoint) {
        return {
          options: [] as Option[],
          total: 0,
          selected: null as Option | null,
        };
      }

      /**
       * Main list/search request
       */
      let params: any = {};
      if (field.searchParam?.filter?.field && !field.searchParam?.filter?.type) {
        params[field.searchParam?.filter?.field] = debouncedInput; //{name:text}
      } else if (field.searchParam?.filter?.field && field.searchParam?.filter?.type) {
        params[field.searchParam?.filter?.field] =
          `${field.searchParam?.filter.type}|${debouncedInput}`; //{field:type|value}
      }
      if (field.searchParam.queryParam && !field.searchParam?.filter) {
        params[field.searchParam.queryParam] = debouncedInput;
      }
      if (field.searchParam?.staticFilters) {
        field.searchParam.staticFilters.forEach((staticFilter) => {
          if (staticFilter.filter.type) {
            //{field:EQUALS|value,name:EQUALS|value}
            params[staticFilter.filter.name] =
              `${staticFilter.filter.type}|${staticFilter.value}|${staticFilter.valueTo}`;
          } else {
            //{field:value,name:value}
            params[staticFilter.filter.name] = staticFilter.value;
          }
        });
      }
      if (field.searchParam?.staticParams) {
        Object.entries(field.searchParam.staticParams).forEach(([key, val]) => {
          params[key] = val;
        });
      }
      if (field.extraParams && formState) {
        const extra = field.extraParams(formState);
        Object.entries(extra).forEach(([key, val]) => {
          if (val != null) {
            params[key] = val;
          }
        });
      }
      const hasFilter =
        field.searchParam?.filter || (field.searchParam?.staticFilters?.length ?? 0) > 0;
      params =
        field.searchParam.queryParam && hasFilter
          ? { [field.searchParam.queryParam]: JSON.stringify(params) }
          : params;
      const listResponse = await apiProvider.get(field.searchParam.endpoint, { params });
      const payload = getArrayPayload(listResponse.data);

      const options = payload.map(mapToOption).filter((item): item is Option => item !== null);

      const total = listResponse.data?.meta?.total ?? listResponse.data?.total ?? options.length;

      /**
       * Load selected item only if needed
       */
      let selected: Option | null = null;

      if (value?.value) {
        const existing = options.find((o) => o.value === value.value);

        if (existing) {
          selected = existing;
        } else {
          const selectedResponse = await apiProvider.get(
            `${field.searchParam.endpoint}/${value.value}`
          );

          const selectedPayload =
            selectedResponse.data &&
            typeof selectedResponse.data === 'object' &&
            'data' in selectedResponse.data
              ? selectedResponse.data.data
              : selectedResponse.data;

          selected = mapToOption(selectedPayload);
        }
      }

      return {
        options,
        total,
        selected,
      };
    },

    enabled:
      Boolean(field?.searchParam?.endpoint) &&
      combobox.dropdownOpened &&
      (debouncedInput === '' ||
        debouncedInput.trim().length >= (field?.searchParam?.minChars || 2)),

    staleTime: 60_000,
  });

  useEffect(() => {
    setInputValue(value?.label || '');
    if (!value) {
      combobox.resetSelectedOption();
    }
  }, [value]);
  /**
   * Static Select Mode
   */
  // if (isStaticSelect) {
  //   return (
  //     <Select
  //       searchable
  //       clearable
  //       disabled={disabled}
  //       value={value?.value}
  //       placeholder={
  //         field.placeholder ?? `Select ${field.label}`
  //       }
  //       data={
  //         selectQuery.data?.options.map((option) => ({
  //           value: option.value,
  //           label: option.label,
  //         })) ?? []
  //       }
  //       onChange={(_, option) => onChange(option) }
  //       error={error}
  //     />
  //   )
  // }

  // console.log(selectQuery.data)
  // if ( isStaticSelect
  //   //&&
  //   // inputValue === '' &&
  //   // selectQuery.data?.total > 0 &&
  //   // (selectQuery.data?.options?.length || 0) == selectQuery.data?.total
  // ) {

  //   return (
  //     <SelectField
  //       value={value}
  //       disabled={disabled}
  //       onChange={(option) =>{
  //         onChange(option);
  //         setInputValue(option?.label || '')
  //       }}
  //       placeholder={field.placeholder}
  //       options={selectQuery.data?.options ?? []}
  //       error={error}
  //     />
  //   )
  // }

  /**
   * Async Autocomplete Mode
   */
  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(selectedValue, optionProps) => {
        const selected = (selectQuery.data?.options ?? []).find(
          (option) => option.value === selectedValue
        );
        onChange(selected || null);
        if (clearAfterSelect) {
          setInputValue('');
        } else {
          setInputValue(selected?.label || '');
          combobox.closeDropdown();
        }
      }}
      position="bottom"
      middlewares={{ flip: false }}
    >
      <Combobox.Target>
        <InputBase
          disabled={disabled}
          value={inputValue}
          placeholder={field.placeholder ?? `Search ${field.label.toLowerCase()}...`}
          onFocus={() => combobox.openDropdown()}
          onChange={(event) => {
            setInputValue(event.currentTarget.value);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            if (!event.currentTarget.value) {
              onChange(null);
            }
          }}
          error={error}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options
          style={{
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {selectQuery.isLoading ? (
            <Combobox.Empty>
              <Loader size="16" />
            </Combobox.Empty>
          ) : null}

          {!selectQuery.isLoading && selectQuery.data?.total === 0 ? (
            <Combobox.Empty>
              <Text size="sm" c="dimmed">
                No results found
              </Text>
            </Combobox.Empty>
          ) : null}

          {(selectQuery.data?.options ?? []).map((option) => {
            const isSelected = selectedValues?.includes(option.value) ?? false;
            return (
              <Combobox.Option key={option.value} value={option.value}>
                <Group justify="space-between" gap="xs" w="100%">
                  <Text size="sm">{option.label}</Text>
                  {isSelected ? <Check size={14} /> : null}
                </Group>
              </Combobox.Option>
            );
          })}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
