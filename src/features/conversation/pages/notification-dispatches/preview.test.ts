import {
  buildPreview,
  extractParams,
  missingParams,
  renderTemplate,
  type NotificationBodies,
} from './preview';

const context = {
  patientName: 'Ada Lovelace',
  date: '2026-01-15',
  hospitalName: 'HealthStack Clinic',
  narrative: '<strong>All results normal.</strong>',
  rescheduleLink: '',
};

const bodies: NotificationBodies = {
  email: {
    subject: 'Appointment for {{patientName}}',
    body: 'Hello {{patientName}}, your appointment is on {{date}}.',
    html: '<p>Hello {{patientName}}</p><div>{{narrative}}</div>',
  },
  sms: {
    body: 'Hi {{patientName}}, appointment {{date}} at {{hospitalName}}.',
  },
  sms_proxy: {
    body: 'Proxy copy',
  },
  whatsapp: {
    body: 'Hi {{patientName}} — see you on {{date}}.{{#if missingToken}} BACKFILL{{/if}}',
  },
};

describe('notification dispatch preview', () => {
  describe('renderTemplate', () => {
    it('substitutes tokens from the context', () => {
      expect(renderTemplate('Hello {{patientName}}', context)).toBe('Hello Ada Lovelace');
    });

    it('renders a missing token as an empty string, like the backend', () => {
      expect(renderTemplate('[{{notInContext}}]', context)).toBe('[]');
    });

    it('does not escape HTML in token values (noEscape: true)', () => {
      expect(renderTemplate('{{narrative}}', context)).toBe('<strong>All results normal.</strong>');
    });

    it('treats null/undefined source as an empty body', () => {
      expect(renderTemplate(null, context)).toBe('');
      expect(renderTemplate(undefined, context)).toBe('');
    });

    it('supports block helpers so conditional copy matches the backend', () => {
      expect(renderTemplate('a{{#if rescheduleLink}} b{{/if}}', context)).toBe('a');
      expect(renderTemplate('a{{#if patientName}} b{{/if}}', context)).toBe('a b');
    });
  });

  describe('template parameter validation', () => {
    it('lists the context paths a body references, deduped and ordered', () => {
      expect(
        extractParams('Hi {{patientName}} {{sale.total}}', null, '{{{narrative}}} {{patientName}}')
      ).toEqual(['patientName', 'sale.total', 'narrative']);
    });

    it('ignores block helpers, comments, partials and numeric placeholders', () => {
      expect(
        extractParams('{{#if x}}{{/if}}{{! note }}{{> partial}}{{1}}{{else}}{{this}}')
      ).toEqual([]);
    });

    it('counts an empty string as provided and a null value as provided', () => {
      expect(missingParams(['a', 'b.c'], { a: '', b: {} })).toEqual(['b.c']);
      expect(missingParams(['a'], { a: null })).toEqual([]);
      expect(missingParams(['a'], {})).toEqual(['a']);
    });

    it('reports the missing parameters per body', () => {
      const channels = buildPreview(
        {
          email: { subject: 'For {{patientName}}', body: 'Hi {{patientName}} on {{date}}' },
          sms: { body: 'Hi {{patientName}} — {{hospitalName}}' },
          whatsapp: { body: 'Hi {{patientName}}' },
        },
        { patientName: 'Ada' }
      );

      expect(channels.map((channel) => [channel.key, channel.missingParams])).toEqual([
        ['email', ['date']],
        ['sms', ['hospitalName']],
        ['whatsapp', []],
      ]);
    });

    it('does not require a token that only appears in a block condition', () => {
      const [sms] = buildPreview(
        { sms: { body: 'Hi{{#if rescheduleLink}} Reschedule available{{/if}}' } },
        {}
      );
      expect(sms.missingParams).toEqual([]);
    });

    it('keeps the missing list on a channel whose template fails to compile', () => {
      const [email] = buildPreview({ email: { body: '{{#if patientName}}unclosed {{date}}' } }, {});
      expect(email.error).toBeTruthy();
      expect(email.missingParams).toEqual(['date']);
    });
  });

  describe('buildPreview', () => {
    it('returns channels in the stable email → sms → whatsapp order', () => {
      expect(buildPreview(bodies, context).map((channel) => channel.key)).toEqual([
        'email',
        'sms',
        'whatsapp',
      ]);
    });

    it('renders every field of the email channel', () => {
      const [email] = buildPreview(bodies, context);
      expect(email).toEqual({
        key: 'email',
        label: 'Email',
        subject: 'Appointment for Ada Lovelace',
        text: 'Hello Ada Lovelace, your appointment is on 2026-01-15.',
        html: '<p>Hello Ada Lovelace</p><div><strong>All results normal.</strong></div>',
        missingParams: [],
      });
    });

    it('prefers bodies.sms over bodies.sms_proxy', () => {
      const sms = buildPreview(bodies, context).find((channel) => channel.key === 'sms');
      expect(sms?.text).toBe('Hi Ada Lovelace, appointment 2026-01-15 at HealthStack Clinic.');
    });

    it('falls back to bodies.sms_proxy when there is no sms body', () => {
      const sms = buildPreview({ sms_proxy: { body: 'Proxy copy' } }, context).find(
        (channel) => channel.key === 'sms'
      );
      expect(sms?.text).toBe('Proxy copy');
    });

    it('omits channels the template does not define', () => {
      expect(buildPreview({ whatsapp: { body: 'Hi' } }, context).map((c) => c.key)).toEqual([
        'whatsapp',
      ]);
    });

    it('returns nothing for empty or missing bodies', () => {
      expect(buildPreview(null, context)).toEqual([]);
      expect(buildPreview({ email: { body: '' } }, context)).toEqual([]);
    });

    it('captures a compile error on the affected channel instead of throwing', () => {
      const [email] = buildPreview(
        { email: { subject: 'x', body: '{{#if patientName}}unclosed' } },
        context
      );
      expect(email.error).toBeTruthy();
      expect(email.text).toBe('');
    });

    it('renders conditionals against the previewed context', () => {
      const [whatsapp] = buildPreview(
        {
          whatsapp: {
            body: 'Hi {{patientName}}.{{#if rescheduleLink}} Reschedule: {{rescheduleLink}}{{/if}}',
          },
        },
        { ...context, rescheduleLink: 'https://example.com/r' }
      );
      expect(whatsapp.text).toBe('Hi Ada Lovelace. Reschedule: https://example.com/r');
    });
  });
});
