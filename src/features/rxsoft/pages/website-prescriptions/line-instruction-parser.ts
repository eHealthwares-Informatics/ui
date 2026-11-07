import { parsePrescription } from '@/lib/prescription-parser';

/** Line-editor fields that a parsed instruction can populate. */
export type ParsedLineFields = {
  freetextName?: string;
  strength?: string;
  frequency?: string;
  durationDays?: number;
  quantity?: number;
  instruction?: string;
};

export type ParseSummary = {
  status: 'ok' | 'needs_review' | 'unparseable' | string;
  warnings: string[];
  unparsed: string[];
};

const COUNT_UNITS = new Set([
  'tablet',
  'capsule',
  'pill',
  'sachet',
  'suppository',
  'pessary',
  'ampoule',
  'vial',
  'patch',
  'drop',
  'puff',
  'spray',
  'application',
  'lozenge',
  'scoop',
  'nebule',
  'enema',
  'teaspoon',
  'tablespoon',
]);

function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function strengthLabel(strength: any): string {
  if (!strength) return '';
  if (strength.ratio) return `1:${strength.ratio[1]}`;
  const value =
    strength.low != null && strength.high != null
      ? `${strength.low}/${strength.high}`
      : strength.value != null
        ? `${strength.value}`
        : strength.low != null
          ? `${strength.low}`
          : '';
  const unit = strength.unit ?? '';
  const per = strength.per ? `/${strength.per.value ?? ''}${strength.per.unit ?? ''}` : '';
  return `${value}${unit}${per}`;
}

function formatIngredients(ingredients: any[]): string {
  return ingredients
    .map((i) => strengthLabel(i?.strength))
    .filter(Boolean)
    .join('/');
}

function formatFrequency(timing: any): string | undefined {
  if (!timing) return undefined;
  if (timing.stat) return 'stat';
  if (timing.frequency != null && timing.period != null) {
    const f = timing.frequency;
    const p = timing.period;
    const u = timing.periodUnit;
    const max = timing.periodMax ? `-${timing.periodMax}` : '';
    if (u === 'd' && p === 1) return f === 1 ? 'once daily' : `${f}x daily`;
    if (u === 'd' && f === 1) return `every ${p}${max} days`;
    if (u === 'h' && f === 1) return `every ${p}${max} hours`;
    if (u === 'wk' && f === 1 && p === 1) return 'once weekly';
    const unitWord =
      u === 'd' ? 'day' : u === 'h' ? 'hour' : u === 'wk' ? 'week' : u === 'mo' ? 'month' : u;
    return `${f} x per ${p}${max} ${unitWord}`;
  }
  if (Array.isArray(timing.when) && timing.when.length) return timing.when.join(', ');
  if (timing.offset) return `after ${timing.offset.value} ${timing.offset.unit}`;
  return undefined;
}

function unitToDays(unit: string | undefined): number | undefined {
  if (unit === 'd') return 1;
  if (unit === 'wk') return 7;
  if (unit === 'mo') return 30;
  if (unit === 'a') return 365;
  return undefined;
}

function durationToDays(duration: any): number | undefined {
  if (!duration || duration.until || duration.indefinite || duration.count != null) {
    return undefined;
  }
  const factor = unitToDays(duration.unit);
  if (!factor) return undefined;
  const value = duration.value ?? duration.high;
  return typeof value === 'number' ? Math.round(value * factor) : undefined;
}

function dosesPerDay(timing: any): number | null {
  if (!timing || timing.frequency == null || timing.period == null) return null;
  const p = timing.period;
  const u = timing.periodUnit;
  const periodInDays =
    u === 'h' ? p / 24 : u === 'd' ? p : u === 'wk' ? p * 7 : u === 'mo' ? p * 30 : null;
  if (!periodInDays) return null;
  return timing.frequency / periodInDays;
}

/** Total units to dispense = per-dose count × doses/day × days (count units only). */
function computeQuantity(step: any, days: number | undefined): number | undefined {
  if (!step?.dose || !days || !COUNT_UNITS.has(step.dose.unit)) return undefined;
  const perDose = step.dose.value ?? step.dose.high;
  if (typeof perDose !== 'number') return undefined;
  const perDay = dosesPerDay(step.timing);
  if (perDay == null) return undefined;
  const total = Math.ceil(perDose * perDay * days);
  return Number.isFinite(total) && total > 0 ? total : undefined;
}

function formatInstruction(step: any): string | undefined {
  if (!step) return undefined;
  const bits: string[] = [];
  if (step.route?.value) bits.push(step.route.value.replace(/_/g, ' '));
  if (step.site) bits.push(step.site);
  if (Array.isArray(step.timing?.when) && step.timing.when.length) {
    bits.push(step.timing.when.join(', '));
  }
  if (step.asNeeded?.reason) bits.push(`as needed for ${step.asNeeded.reason}`);
  else if (step.asNeeded) bits.push('as needed');
  if (step.maxDose) bits.push(`max ${step.maxDose.value} ${step.maxDose.unit}/day`);
  if (step.indication) bits.push(step.indication);
  return bits.length ? bits.join(', ') : undefined;
}

/** Map a parser result to the line-editor fields. */
export function mapParsedInstruction(result: any): ParsedLineFields {
  if (!result) return {};
  const step = result.regimen?.[0] ?? null;
  const days = durationToDays(step?.duration);
  const fields: ParsedLineFields = {};

  if (result.drug?.text) fields.freetextName = titleCase(String(result.drug.text));
  const strength = formatIngredients(result.ingredients ?? []);
  if (strength) fields.strength = strength;
  const frequency = formatFrequency(step?.timing);
  if (frequency) fields.frequency = frequency;
  if (days != null) fields.durationDays = days;
  const quantity = computeQuantity(step, days);
  if (quantity != null) fields.quantity = quantity;
  const instruction = formatInstruction(step);
  if (instruction) fields.instruction = instruction;
  return fields;
}

/** Non-info warnings plus unparsed text, for the review alert. */
export function summariseParse(result: any): ParseSummary {
  return {
    status: result?.status ?? 'unparseable',
    warnings: (result?.warnings ?? [])
      .filter((w: any) => w.severity !== 'info')
      .map((w: any) => `${w.code}: ${w.message}`),
    unparsed: (result?.unparsed ?? []).map((u: any) => u.text),
  };
}

export { parsePrescription };
