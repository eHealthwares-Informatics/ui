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

  it('persists the named parameter format, parameter names and samples', () => {
    const payload = config.buildCreatePayload?.({
      organizationId: null,
      code: 'named_code',
      name: 'Named template',
      description: '',
      enabled: true,
      whatsappBody: 'WA',
      whatsappTemplateName: 'order_confirmation',
      whatsappTemplateLanguage: 'en_US',
      whatsappTemplateBody: 'Hi {{customer_name}}',
      parameterFormat: 'named',
      components: [
        {
          type: 'body',
          parameters: [
            {
              source: 'attribute',
              key: 'customer.name',
              parameterName: 'customer_name',
              sampleOrFallback: 'Customer',
            },
          ],
        },
      ],
      smsBody: 'SMS',
      emailSubject: 'Subject',
      emailBody: 'Email',
    }) as Record<string, any>;

    expect(payload.bodies.whatsapp_template).toMatchObject({
      name: 'order_confirmation',
      parameterFormat: 'named',
      components: [
        {
          type: 'body',
          parameters: [
            {
              key: 'customer.name',
              parameterName: 'customer_name',
              sampleOrFallback: 'Customer',
            },
          ],
        },
      ],
    });
  });

  it('normalises legacy sampleValue and parameter_name when loading a row', () => {
    const form = config.buildFormState?.({
      ...ROW,
      bodies: {
        ...ROW.bodies,
        whatsapp_template: {
          name: 'order_confirmation',
          language: 'en',
          body: 'Hi',
          parameterFormat: 'named',
          components: [
            {
              type: 'body',
              parameters: [
                {
                  source: 'attribute',
                  key: 'customer.name',
                  parameter_name: 'customer_name',
                  sampleValue: 'Customer',
                },
              ],
            },
          ],
        },
      },
    }) as Record<string, any>;

    expect(form.parameterFormat).toBe('named');
    expect(form.components[0].parameters[0]).toEqual(
      expect.objectContaining({
        key: 'customer.name',
        parameterName: 'customer_name',
        sampleOrFallback: 'Customer',
      })
    );
  });
});
