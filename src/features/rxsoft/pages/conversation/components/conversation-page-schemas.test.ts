import { describe, expect, it } from 'vitest';
import { channelPageSchema } from './conversation-page-schemas';

/**
 * Regression: the channels edit modal rendered Code blank and never PATCHed it
 * because `buildFormState`/`defaultState` omitted `code` even though the field
 * and both payload builders included it.
 */
describe('channelPageSchema code round-trip', () => {
  const row = {
    id: '6ad73869f4f59298cbd7d73c',
    name: 'Healthstack WhatsApp',
    type: 'WHATSAPP',
    code: 'HEALTHSTACK_WHATSAPP',
    provider: 'Meta',
    isActive: true,
    metadata: {},
    config: {},
  };

  it('seeds the edit form with the existing code', () => {
    const state = channelPageSchema.buildFormState!(row);
    expect(state.code).toBe('HEALTHSTACK_WHATSAPP');
  });

  it('includes code in the default create state', () => {
    expect(channelPageSchema.defaultState).toMatchObject({ code: '' });
  });

  it('includes code in the create payload', () => {
    const payload = channelPageSchema.buildCreatePayload!({
      ...row,
      type: { value: 'WHATSAPP', label: 'WHATSAPP' },
    });
    expect(payload).toMatchObject({ code: 'HEALTHSTACK_WHATSAPP' });
  });

  it('includes code in the update payload', () => {
    const payload = channelPageSchema.buildUpdatePayload!({
      ...row,
      type: { value: 'WHATSAPP', label: 'WHATSAPP' },
    });
    expect(payload).toMatchObject({ code: 'HEALTHSTACK_WHATSAPP' });
  });
});
