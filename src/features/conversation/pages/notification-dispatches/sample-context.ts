/**
 * Builds the sample `context` the dispatch Test dialog is prefilled with.
 *
 * The tokens come from the dispatch's template — `metadata.options` (the
 * authored token list, e.g. HealthStack templates) plus every `{{token}}` used
 * by the template bodies. Known tokens get a realistic sample value so the
 * rendered preview reads naturally; everything else is prefilled with an empty
 * string, which the backend accepts (`missingParamsForChannel` only requires
 * the key to be present).
 */

export type TemplateBody = {
  body?: string;
  subject?: string;
  html?: string;
};

export type SampleTemplate = {
  code?: string;
  kind?: string;
  metadata?: { options?: string[] } & Record<string, unknown>;
  bodies?: Record<string, TemplateBody | undefined>;
};

/**
 * Realistic values for the tokens the seeded templates use. Anything not
 * listed here is prefilled with `''`.
 */
const SAMPLE_VALUES: Record<string, unknown> = {
  patientName: 'Ada Lovelace',
  patient_name: 'Ada Lovelace',
  firstName: 'Ada',
  lastName: 'Lovelace',
  patientId: 'PT-0001',
  patient_id: 'PT-0001',
  doctorName: 'Dr. Grace Hopper',
  doctor_name: 'Dr. Grace Hopper',
  providerName: 'Dr. Grace Hopper',
  department: 'Cardiology',
  hospitalName: 'HealthStack Clinic',
  hospital_name: 'HealthStack Clinic',
  facilityAddress: '12 Marina Road, Lagos',
  address: '12 Marina Road, Lagos',
  date: '2026-01-15',
  time: '10:30',
  dateGenerated: '2026-01-10',
  appointmentDate: '2026-01-15',
  appointmentTime: '10:30',
  phone: '+2348000000000',
  email: 'patient@example.com',
  instructions: 'Please arrive 15 minutes early.',
  rescheduleLink: 'https://example.com/reschedule',
  privacyPolicyLink: 'https://example.com/privacy',
  link: 'https://example.com',
  url: 'https://example.com',
  orderNumber: 'ORD-0001',
  orderNo: 'ORD-0001',
  invoiceNo: 'INV-0001',
  invoiceNumber: 'INV-0001',
  amount: '1500',
  currency: 'NGN',
  status: 'Confirmed',
  code: 'CODE-0001',
  itemLines: [],
};

/** Simple `{{token}}` names; block helpers (`{{#if}}`, `{{/if}}`) excluded. */
const TOKEN_PATTERN = /\{\{\s*([^}#/>][^}]*)\}\}/g;

export function extractTemplateTokens(template: SampleTemplate | null | undefined): string[] {
  if (!template) {
    return [];
  }

  const tokens: string[] = [];
  const seen = new Set<string>();
  const add = (value: unknown) => {
    const token = String(value ?? '')
      .trim()
      .split(/\s+/)[0];
    if (!token || token === 'this' || token === 'else' || seen.has(token)) {
      return;
    }
    seen.add(token);
    tokens.push(token);
  };

  // Authored token list first — it is the canonical order.
  for (const token of template.metadata?.options ?? []) {
    add(token);
  }

  // Then any token used by a body but missing from the authored list.
  for (const channel of Object.values(template.bodies ?? {})) {
    if (!channel) {
      continue;
    }
    for (const text of [channel.subject, channel.body, channel.html]) {
      if (typeof text !== 'string') {
        continue;
      }
      for (const match of text.matchAll(TOKEN_PATTERN)) {
        add(match[1]);
      }
    }
  }

  return tokens;
}

/** Sample context for a template (empty object when it has no tokens). */
export function buildSampleContext(
  template: SampleTemplate | null | undefined
): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  for (const token of extractTemplateTokens(template)) {
    context[token] = token in SAMPLE_VALUES ? SAMPLE_VALUES[token] : '';
  }
  return context;
}

/** Pretty-printed JSON for the dialog's Context textarea. */
export function formatSampleContext(template: SampleTemplate | null | undefined): string {
  return JSON.stringify(buildSampleContext(template), null, 2);
}
