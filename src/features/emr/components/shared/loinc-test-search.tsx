import { ConceptAutocomplete, type ConceptValue } from './concept-autocomplete';

export type LoincTest = {
  id: string;
  code: string;
  name: string;
  system: string | null;
  source?: 'catalog' | 'free-text';
};

/**
 * LOINC picker backed by the concepts API. Free text is accepted and stored as
 * a LOINC-shaped value so existing request-item mapping keeps working.
 */
export function LoincTestSearch({
  label,
  placeholder = 'Search LOINC tests or type a value…',
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  limit = 20,
}: {
  label?: string;
  placeholder?: string;
  value: LoincTest | null;
  onChange: (test: LoincTest | null) => void;
  required?: boolean;
  error?: React.ReactNode;
  disabled?: boolean;
  limit?: number;
}) {
  const mapped: ConceptValue | null = value
    ? {
        concept: 'LOINC',
        id: value.id,
        code: value.code || undefined,
        name: value.name,
        source: value.source ?? 'catalog',
      }
    : null;

  return (
    <ConceptAutocomplete
      concept="LOINC"
      label={label}
      placeholder={placeholder}
      required={required}
      error={error}
      disabled={disabled}
      limit={limit}
      value={mapped}
      onChange={(next) => {
        if (!next) {
          onChange(null);
          return;
        }
        onChange({
          id: next.id ?? `free-text-${next.name}`,
          code: next.code ?? '',
          name: next.name,
          system: null,
          source: next.source,
        });
      }}
    />
  );
}
