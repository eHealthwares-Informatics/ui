import { ConceptAutocomplete, type ConceptValue } from './concept-autocomplete';

export type DicomTest = {
  id?: string;
  code?: string;
  name: string;
  source?: 'catalog' | 'free-text';
};

/** DICOM picker backed by the concepts API; free text is accepted. */
export function DicomTestSearch({
  label,
  placeholder = 'Search DICOM tests or type a value…',
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  limit = 20,
}: {
  label?: string;
  placeholder?: string;
  value: DicomTest | null;
  onChange: (test: DicomTest | null) => void;
  required?: boolean;
  error?: React.ReactNode;
  disabled?: boolean;
  limit?: number;
}) {
  const mapped: ConceptValue | null = value
    ? {
        concept: 'DICOM',
        id: value.id,
        code: value.code,
        name: value.name,
        source: value.source ?? 'catalog',
      }
    : null;

  return (
    <ConceptAutocomplete
      concept="DICOM"
      label={label}
      placeholder={placeholder}
      required={required}
      error={error}
      disabled={disabled}
      limit={limit}
      value={mapped}
      onChange={(next) =>
        onChange(
          next
            ? {
                id: next.id,
                code: next.code,
                name: next.name,
                source: next.source,
              }
            : null
        )
      }
    />
  );
}
