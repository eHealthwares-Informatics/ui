import { buildNotificationTemplatesConfig } from './schema';

const ROW = {
  id: 'tpl-1',
  organizationId: null,
  code: 'order_confirmation',
  name: 'Order confirmation',
  description: null,
  enabled: true,
  bodies: {
    whatsapp: { body: 'Hi {{customer.name}}' },
    whatsapp_template: {
      name: 'order_confirmation',
      language: 'en',
      body: 'Hi {{customer.name}}',
      components: [],
    },
    sms: { body: 'Hi {{customer.name}}' },
    email: { subject: 'Order', body: 'Hi' },
  },
};

describe('notification template submit payloads', () => {
  const config = buildNotificationTemplatesConfig({ organizationId: null });

  it('sends only changed meta fields and preserves the global scope', () => {
    const payload = config.buildUpdatePayload?.({ name: 'Order confirmed' }, ROW) as Record<
      string,
      unknown
    >;

    expect(payload).toEqual({
      organizationId: null,
      name: 'Order confirmed',
    });
  });

  it('rebuilds the full bodies object when a channel body changes', () => {
    const payload = config.buildUpdatePayload?.(
      { whatsappBody: 'Hello {{customer.name}}' },
      ROW
    ) as Record<string, any>;

    expect(payload.organizationId).toBeNull();
    expect(payload.name).toBeUndefined();
    expect(payload.bodies.whatsapp).toEqual({ body: 'Hello {{customer.name}}' });
    expect(payload.bodies.sms).toEqual({ body: 'Hi {{customer.name}}' });
  });

  it('creates a template with every channel body', () => {
    const payload = config.buildCreatePayload?.({
      organizationId: null,
      code: 'new_code',
      name: 'New template',
      description: '',
      enabled: true,
      whatsappBody: 'WA',
      whatsappTemplateName: 'tpl',
      whatsappTemplateLanguage: 'en',
      whatsappTemplateBody: 'WA template',
      components: [],
      smsBody: 'SMS',
      emailSubject: 'Subject',
      emailBody: 'Email',
    }) as Record<string, any>;

    expect(payload).toMatchObject({
      organizationId: null,
      code: 'new_code',
      name: 'New template',
      description: null,
      enabled: true,
    });
    expect(payload.bodies).toMatchObject({
      whatsapp: { body: 'WA' },
      sms: { body: 'SMS' },
      email: { subject: 'Subject', body: 'Email' },
    });
  });
});
