import { describe, expect, it } from 'vitest';
import { formatAnnotateValue } from './format-annotate';

describe('formatAnnotateValue', () => {
  it('maps body region ids to labels', () => {
    expect(formatAnnotateValue(['right-knee', 'left-shoulder'], { target: 'body' })).toBe(
      'Right knee, Left shoulder'
    );
  });

  it('returns dermatome ids unchanged', () => {
    expect(formatAnnotateValue('L4', { target: 'dermatome' })).toBe('L4');
  });

  it('maps organ structure ids to labels', () => {
    expect(formatAnnotateValue(['left-ventricle'], { target: 'organ', organ: 'heart' })).toBe(
      'Left ventricular cavity'
    );
  });

  it('renders an em dash for empty values', () => {
    expect(formatAnnotateValue([], { target: 'body' })).toBe('—');
    expect(formatAnnotateValue(null, { target: 'dermatome' })).toBe('—');
  });
});
