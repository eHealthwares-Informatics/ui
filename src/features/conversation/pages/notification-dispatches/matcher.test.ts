import { describe, expect, it } from 'vitest';
import { compactMatcher, normalizeMatcher, validateMatcher } from './matcher';

describe('notification dispatch matcher helpers', () => {
  describe('normalizeMatcher', () => {
    it('keeps non-empty objects and nulls everything else', () => {
      const matcher = { path: 'channel', operator: 'eq', value: 'WHATSAPP' };
      expect(normalizeMatcher(matcher)).toEqual(matcher);
      expect(normalizeMatcher({})).toBeNull();
      expect(normalizeMatcher([])).toBeNull();
      expect(normalizeMatcher('x')).toBeNull();
      expect(normalizeMatcher(null)).toBeNull();
    });
  });

  describe('validateMatcher', () => {
    it('allows an empty matcher', () => {
      expect(validateMatcher(null)).toBe(true);
      expect(validateMatcher(undefined)).toBe(true);
      expect(validateMatcher({})).toBe(true);
    });

    it('accepts a leaf with a supported operator', () => {
      expect(validateMatcher({ path: 'context.channel', operator: 'eq', value: 'WHATSAPP' })).toBe(
        true
      );
      expect(validateMatcher({ path: 'attempts', operator: '>', value: 2 })).toBe(true);
    });

    it('rejects a non-object matcher', () => {
      expect(validateMatcher([])).toMatch(/must be a JSON object/);
      expect(validateMatcher('x')).toMatch(/must be a JSON object/);
    });

    it('rejects a leaf without a path', () => {
      expect(validateMatcher({ operator: 'eq', value: 1 })).toMatch(
        /path must be a non-empty string/
      );
    });

    it('rejects an unsupported operator', () => {
      expect(validateMatcher({ path: 'x', operator: 'sideways', value: 1 })).toMatch(
        /not supported/
      );
    });

    it('validates and/or/not children', () => {
      expect(
        validateMatcher({
          and: [
            { path: 'channel', operator: 'eq', value: 'WHATSAPP' },
            { path: 'tier', operator: 'in', value: ['gold'] },
          ],
        })
      ).toBe(true);
      expect(validateMatcher({ and: [] })).toMatch(/non-empty array/);
      expect(validateMatcher({ and: [{ path: 'x', operator: 'eq' }, { operator: 'eq' }] })).toMatch(
        /path must be a non-empty string/
      );
      expect(validateMatcher({ not: { path: 'channel', operator: 'eq', value: 'SMS' } })).toBe(
        true
      );
    });

    it('rejects an object with none of the matcher keys', () => {
      expect(validateMatcher({ foo: 'bar' })).toMatch(/must contain path\/operator\/value/);
    });
  });

  describe('compactMatcher', () => {
    it('summarises leaves and combinators', () => {
      expect(compactMatcher({ path: 'channel', operator: 'eq', value: 'WHATSAPP' })).toBe(
        'channel eq "WHATSAPP"'
      );
      expect(compactMatcher({ path: 'x', operator: 'exists' })).toBe('x exists');
      expect(compactMatcher({ and: [{}, {}] })).toBe('and(2)');
      expect(compactMatcher({ or: [{}] })).toBe('or(1)');
      expect(compactMatcher({ not: {} })).toBe('not(...)');
      expect(compactMatcher({})).toBe('');
      expect(compactMatcher(null)).toBe('');
    });
  });
});
