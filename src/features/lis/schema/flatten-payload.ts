/**
 * LIS payload flattening.
 *
 * `RenderField.tsx` stores `type: 'select'` values in form state as option
 * objects (`{ value, label }`), and async-select fields can store richer
 * option objects too. LIS resource schemas previously passed form values
 * straight through (`buildCreatePayload: (v) => v`), so the LIS backend
 * rejected create payloads with 400s like
 * `domain must be one of the following values: ORDER, SAMPLE, RESULT`
 * (the wire value was `{"value":"ORDER","label":"Order"}`).
 *
 * This helper unwraps any top-level option object carrying a string `value`
 * — mirroring the per-field flattening rxsoft schemas apply in their own
 * `buildCreatePayload`s (e.g. pos-terminals
 * `providerType: (values.providerType as any)?.value ?? values.providerType`)
 * and the async-select flattening fixed for stock-locations.
 */
export function flattenOptionObjects(
  values: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof (value as { value?: unknown }).value === 'string'
    ) {
      out[key] = (value as { value: unknown }).value;
    } else {
      out[key] = value;
    }
  }
  return out;
}
