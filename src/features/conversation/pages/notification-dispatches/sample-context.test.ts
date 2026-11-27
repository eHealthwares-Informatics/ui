import {
  buildSampleContext,
  extractTemplateTokens,
  formatSampleContext,
  type SampleTemplate,
} from './sample-context';

const template: SampleTemplate = {
  code: 'appointment',
  metadata: {
    options: ['patientName', 'date', 'doctorName', 'unknownToken'],
  },
  bodies: {
    sms: { body: 'Hello {{patientName}}, your appointment is on {{date}}.' },
    whatsapp: {
      body: 'Hi {{patientName}} — {{doctorName}} at {{hospitalName}}.{{#if rescheduleLink}} Reschedule: {{rescheduleLink}}{{/if}}',
    },
    email: {
      subject: 'Appointment for {{patientName}}',
      body: '{{instructions}}',
      html: '<p>{{patientName}}</p>',
    },
  },
};

describe('notification dispatch sample context', () => {
  it('lists authored tokens first, then body-only tokens, without duplicates', () => {
    expect(extractTemplateTokens(template)).toEqual([
      'patientName',
      'date',
      'doctorName',
      'unknownToken',
      'hospitalName',
      'rescheduleLink',
      'instructions',
    ]);
  });

  it('fills known tokens with sample values and unknown ones with an empty string', () => {
    expect(buildSampleContext(template)).toEqual({
      patientName: 'Ada Lovelace',
      date: '2026-01-15',
      doctorName: 'Dr. Grace Hopper',
      unknownToken: '',
      hospitalName: 'HealthStack Clinic',
      rescheduleLink: 'https://example.com/reschedule',
      instructions: 'Please arrive 15 minutes early.',
    });
  });

  it('ignores block helpers and partials', () => {
    expect(
      extractTemplateTokens({
        bodies: { sms: { body: '{{#if x}}{{else}}{{/if}}{{> partial}}{{this}}{{value}}' } },
      })
    ).toEqual(['value']);
  });

  it('formats an empty object when the template has no tokens', () => {
    expect(formatSampleContext(null)).toBe('{}');
    expect(formatSampleContext({ metadata: { options: [] } })).toBe('{}');
  });

  it('pretty-prints the sample so it can be edited in the textarea', () => {
    expect(formatSampleContext({ metadata: { options: ['date'] } })).toBe(
      JSON.stringify({ date: '2026-01-15' }, null, 2)
    );
  });
});
