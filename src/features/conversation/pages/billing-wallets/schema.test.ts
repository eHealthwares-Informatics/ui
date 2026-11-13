import { buildBillingWalletsConfig } from './schema';

const CONFIG = buildBillingWalletsConfig({
  organizationId: null,
  onCredit: () => {},
  onEditWallet: () => {},
  channels: [{ id: 'chan-1', name: 'WhatsApp', code: 'wa' }],
  organizations: [{ id: 'org-1', name: 'Acme', code: 'ACME' }],
  participants: [{ id: 'part-1', name: 'Jane', userId: 'user-1' }],
});

function ownerField() {
  const [group] = CONFIG.createFieldGroups ?? [];
  const field = group.fields.find((item) => item.name === 'ownerId');
  if (!field) {
    throw new Error('ownerId field missing');
  }
  return field;
}

describe('billing wallet owner autocomplete', () => {
  it('follows the selected owner type', () => {
    const field = ownerField();
    expect(field.type).toBe('autocomplete');

    expect(field.optionsFor?.({ ownerType: { value: 'ORGANISATION' } })).toEqual([
      { value: 'org-1', label: 'Acme (ACME)' },
    ]);
    expect(field.optionsFor?.({ ownerType: { value: 'CHANNEL' } })).toEqual([
      { value: 'chan-1', label: 'WhatsApp (wa)' },
    ]);
    expect(field.optionsFor?.({ ownerType: { value: 'PARTICIPANT' } })).toEqual([
      { value: 'part-1', label: 'Jane (user-1)' },
    ]);
  });

  it('defaults to organisation options when no type is selected', () => {
    expect(ownerField().optionsFor?.({})).toEqual([{ value: 'org-1', label: 'Acme (ACME)' }]);
  });

  it('creates the wallet with the selected owner', () => {
    const payload = CONFIG.buildCreatePayload?.({
      ownerType: { value: 'CHANNEL', label: 'Channel' },
      ownerId: { value: 'chan-1', label: 'WhatsApp' },
    }) as Record<string, unknown>;

    expect(payload).toEqual({ ownerType: 'CHANNEL', ownerId: 'chan-1' });
  });

  it('drops an owner id that does not belong to the selected owner type', () => {
    const payload = CONFIG.buildCreatePayload?.({
      ownerType: { value: 'CHANNEL', label: 'Channel' },
      ownerId: { value: 'org-1', label: 'Acme' },
    }) as Record<string, unknown>;

    expect(payload).toEqual({ ownerType: 'CHANNEL', ownerId: null });
  });
});
