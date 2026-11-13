import { buildBillingRulesConfig } from './schema';

const CONFIG = buildBillingRulesConfig({
  organizationId: null,
  channels: [{ id: 'chan-1', name: 'WhatsApp', code: 'wa' }],
  questionnaires: [{ id: 'qn-1', code: 'intake', name: 'Intake' }],
  questions: [{ id: 'q-1', attribute: 'age', text: 'How old are you?' }],
  aiModels: [{ id: 'm-1', key: 'openai_gpt4o', label: 'GPT-4o' }],
  events: [{ id: 'e-1', key: 'order.created', label: 'Order created' }],
  templates: [
    { id: 't-1', code: 'order_confirmation', name: 'Order confirmation' },
    // A per-org copy shares the code; it must not duplicate the option.
    { id: 't-2', code: 'order_confirmation', name: 'Order confirmation (org)' },
  ],
});

describe('billing rule payloads', () => {
  it('stores reference dimensions by their real value, including channelId', () => {
    const payload = CONFIG.buildCreatePayload?.({
      billTo: { value: 'ORGANISATION', label: 'Organisation' },
      direction: { value: 'OUTBOUND', label: 'Outbound' },
      channelId: { value: 'chan-1', label: 'WhatsApp' },
      questionnaire: { value: 'qn-1', label: 'Intake' },
      question: { value: 'q-1', label: 'Age' },
      event: { value: 'order.created', label: 'Order created' },
      aiModel: { value: 'openai_gpt4o', label: 'GPT-4o' },
      notificationTemplate: { value: 'order_confirmation', label: 'Order confirmation' },
      coins: '5',
      priority: '1',
      active: true,
      reask: '',
    }) as Record<string, unknown>;

    expect(payload).toMatchObject({
      organizationId: null,
      billTo: 'ORGANISATION',
      direction: 'OUTBOUND',
      channelId: 'chan-1',
      questionnaire: 'qn-1',
      question: 'q-1',
      event: 'order.created',
      aiModel: 'openai_gpt4o',
      notificationTemplate: 'order_confirmation',
      coins: 5,
      priority: 1,
      active: true,
      reask: null,
    });
    expect(payload.questionnaireId).toBeUndefined();
    expect(payload.channel).toBeUndefined();
  });

  it('dedupes template options that share a code across scopes', () => {
    const [group] = CONFIG.createFieldGroups ?? [];
    const field = group.fields.find((item) => item.name === 'notificationTemplate');
    expect(field?.options).toEqual([
      { value: 'order_confirmation', label: 'order_confirmation — Order confirmation' },
    ]);
  });

  it('scopes updates to the row organisation', () => {
    const org = CONFIG.buildUpdatePayload?.({ coins: '7' }, { id: 'r', organizationId: 'org-9' });
    expect(org).toEqual({ organizationId: 'org-9', coins: 7 });

    const global = CONFIG.buildUpdatePayload?.({ coins: '7' }, { id: 'r', organizationId: null });
    expect(global).toEqual({ organizationId: null, coins: 7 });
  });

  it('resolves stored values back to options for editing', () => {
    const form = CONFIG.buildFormState?.({
      id: 'rule-1',
      organizationId: null,
      channelId: 'chan-1',
      questionnaire: 'qn-1',
      event: 'order.created',
    }) as Record<string, unknown>;

    expect(form.channelId).toEqual({ value: 'chan-1', label: 'WhatsApp (wa)' });
    expect(form.questionnaire).toEqual({ value: 'qn-1', label: 'intake — Intake' });
    expect(form.event).toEqual({ value: 'order.created', label: 'Order created (order.created)' });
  });
});
