import type { AnnotateConfig } from '../../../lib/emr-types';
import { bodyMapRegions } from './body-map-data';
import { organCatalog } from './organ-catalog';

const bodyLabels = new Map(bodyMapRegions.map((region) => [region.id, region.label]));

function humanizeId(id: string): string {
  const text = id.replace(/[-_]+/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : id;
}

/**
 * Render an annotate value as human labels for read-only views and summaries.
 * Falls back to a humanized id when a label is not in the catalogue.
 */
export function formatAnnotateValue(value: unknown, config?: AnnotateConfig): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (config?.target === 'dermatome') {
    return String(value);
  }
  const ids = (Array.isArray(value) ? value : [value]).map(String);
  if (ids.length === 0) {
    return '—';
  }
  if (config?.target === 'organ' && config.organ) {
    const structures = organCatalog[config.organ] ?? [];
    const labels = new Map(structures.map((structure) => [structure.id, structure.label]));
    return ids.map((id) => labels.get(id) ?? humanizeId(id)).join(', ');
  }
  if (config?.target === 'body') {
    return ids.map((id) => bodyLabels.get(id) ?? humanizeId(id)).join(', ');
  }
  return ids.map(humanizeId).join(', ');
}
