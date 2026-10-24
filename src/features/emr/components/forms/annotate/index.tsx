import { Alert } from '@mantine/core';
import type { FormFieldSchema } from '../../../lib/emr-types';
import { BodyMapField } from './body-map';
import { bodyMapRegions } from './body-map-data';
import { DermatomeMapField } from './dermatome-map';
import { OrganMapField } from './organ-map';

/**
 * The `annotate` form field: body regions, dermatome levels, or organ
 * structures, chosen by the field's `annotate.target` config.
 */
export function AnnotateField({
  field,
  value,
  onChange,
}: {
  field: FormFieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const config = field.annotate;
  if (!config) {
    return <Alert color="red">This annotate field is missing its configuration.</Alert>;
  }

  if (config.target === 'dermatome') {
    return (
      <DermatomeMapField
        value={typeof value === 'string' ? value : null}
        onChange={(next) => onChange(next ?? undefined)}
        views={config.views}
        showLabels={config.showLabels}
        label={field.label}
      />
    );
  }

  if (config.target === 'organ') {
    if (!config.organ) {
      return <Alert color="red">Choose an organ for this annotate field.</Alert>;
    }
    return (
      <OrganMapField
        value={Array.isArray(value) ? value.map(String) : []}
        onChange={onChange}
        organ={config.organ}
        structureIds={config.structures}
        multiple={config.multiple}
        label={field.label}
      />
    );
  }

  return (
    <BodyMapField
      value={Array.isArray(value) ? value.map(String) : []}
      onChange={onChange}
      views={config.views}
      regionIds={config.regions}
      regions={bodyMapRegions}
      multiple={config.multiple}
      label={field.label}
    />
  );
}
