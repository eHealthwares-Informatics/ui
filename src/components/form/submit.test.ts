import { afterEach, describe, expect, it } from 'vitest';
import type { Field } from '@/features/rxsoft/types';
import {
  buildZodSchema,
  clearValidationErrors,
  renderValidationErrors,
  validateFields,
} from './submit';

/**
 * Regression for the questionnaire edit form: `questions` is an
 * `accordion-array` (value = array) and `workflowId` an `accordion`
 * (value = object). They used to fall through to the string branch and fail
 * with "Invalid input: expected string, received array/object".
 */
describe('validateFields — structured field types', () => {
  const fields: Field[] = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'questions', label: 'Questions', type: 'accordion-array' },
    { name: 'workflowId', label: 'Workflow', type: 'accordion' },
    { name: 'metadata', label: 'Metadata', type: 'json' },
    { name: 'images', label: 'Images', type: 'multi-image' },
    { name: 'range', label: 'Range', type: 'daterange' },
  ];

  it('accepts arrays/objects for accordion, accordion-array and json', () => {
    expect(
      validateFields(fields, {
        name: 'Questionnaire',
        questions: [{ text: 'How are you?', index: 1 }],
        workflowId: { value: 'w1', label: 'Workflow 1' },
        metadata: { a: 1 },
        images: ['https://example.com/a.png'],
        range: ['2026-01-01', '2026-01-31'],
      })
    ).toEqual({});
  });

  it('does not reject an array or object as a string type mismatch', () => {
    expect(
      validateFields(fields, {
        name: 'Questionnaire',
        questions: [],
        workflowId: null,
        metadata: {},
        images: [],
        range: [],
      })
    ).toEqual({});
  });

  it('labels raw type errors with the field label', () => {
    const textOnly: Field[] = [{ name: 'name', label: 'Name', type: 'text' }];
    const errors = validateFields(textOnly, { name: { unexpected: true } });
    expect(errors.name).toBe('Name is invalid');
  });

  it('notifies a required accordion-array only when it is empty', () => {
    const required: Field[] = [
      { name: 'questions', label: 'Questions', type: 'accordion-array', required: true },
    ];
    expect(validateFields(required, { questions: [] })).toEqual({
      questions: 'Questions is required',
    });
    expect(validateFields(required, { questions: [{ text: 'a' }] })).toEqual({});
  });

  it('builds a schema without throwing for every structured type', () => {
    expect(() =>
      buildZodSchema([
        { name: 'a', label: 'A', type: 'json-accordion-array' },
        { name: 'b', label: 'B', type: 'multi-check' },
        { name: 'c', label: 'C', type: 'image' },
      ])
    ).not.toThrow();
  });
});

describe('renderValidationErrors', () => {
  afterEach(() => {
    clearValidationErrors();
    document.body.innerHTML = '';
  });

  it('shows the labeled message, highlights the field and cleans up', () => {
    document.body.innerHTML = `
      <div class="rx-page-form" data-testid="modal-form">
        <div data-testid="field-questions"><div class="accordion">Rows</div></div>
      </div>`;

    renderValidationErrors({ questions: 'Questions is required' });

    expect(document.querySelector('[data-testid="form-error-summary"]')?.textContent).toContain(
      'Questions is required'
    );

    const field = document.querySelector('[data-testid="field-questions"]') as HTMLElement;
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.classList.contains('rx-field-invalid')).toBe(true);

    // No span existed for this (accordion) field — one is created.
    expect(document.querySelector('[data-testid="field-error-questions"]')?.textContent).toBe(
      'Questions is required'
    );

    clearValidationErrors();
    expect(document.querySelector('[data-testid="form-error-summary"]')).toBeNull();
    expect(document.querySelector('[data-testid="field-error-questions"]')).toBeNull();
    expect(field.classList.contains('rx-field-invalid')).toBe(false);
    expect(field.hasAttribute('aria-invalid')).toBe(false);
  });

  it('maps a nested issue path onto its root field', () => {
    document.body.innerHTML = `
      <div class="rx-page-form" data-testid="modal-form">
        <div data-testid="field-questions"></div>
      </div>`;

    renderValidationErrors({ 'questions.3.text': 'Questions is invalid' });

    const field = document.querySelector('[data-testid="field-questions"]') as HTMLElement;
    expect(field.classList.contains('rx-field-invalid')).toBe(true);
    expect(document.querySelector('[data-testid="field-error-questions"]')?.textContent).toBe(
      'Questions is invalid'
    );
  });
});
