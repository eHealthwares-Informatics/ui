import { describe, expect, it } from 'vitest';
import { normaliseWebsiteEmail } from './auth-store';

describe('normaliseWebsiteEmail', () => {
  it('keeps a real email address', () => {
    expect(normaliseWebsiteEmail('shopper@example.com', 'user-1')).toBe('shopper@example.com');
  });

  it('drops the user id that phone-only accounts put in the email claim', () => {
    const id = 'ed839779-f1b2-44a4-a649-05fb39dff469';
    expect(normaliseWebsiteEmail(id, id)).toBe('');
  });

  it('drops values that are not addresses', () => {
    expect(normaliseWebsiteEmail('not-an-email')).toBe('');
    expect(normaliseWebsiteEmail(null)).toBe('');
    expect(normaliseWebsiteEmail(undefined)).toBe('');
    expect(normaliseWebsiteEmail('')).toBe('');
  });
});
