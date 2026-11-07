import { describe, expect, it } from 'vitest';
import { resolveMediaUrl } from './media-url';

describe('resolveMediaUrl', () => {
  it('returns empty for missing values', () => {
    expect(resolveMediaUrl(null)).toBe('');
    expect(resolveMediaUrl(undefined)).toBe('');
    expect(resolveMediaUrl('')).toBe('');
  });

  it('passes absolute, data and blob URLs through unchanged', () => {
    expect(resolveMediaUrl('https://cdn.example.com/x.jpg')).toBe('https://cdn.example.com/x.jpg');
    expect(resolveMediaUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(resolveMediaUrl('blob:http://localhost/123')).toBe('blob:http://localhost/123');
  });

  it('maps /uploads onto the API base so the /api proxy serves it', () => {
    // VITE_RXSOFT_API_URL defaults to /api (same origin) in tests.
    expect(resolveMediaUrl('/uploads/prescriptions/x.jpg')).toBe(
      '/api/uploads/prescriptions/x.jpg'
    );
  });

  it('leaves non-upload relative paths untouched', () => {
    expect(resolveMediaUrl('/other/x.jpg')).toBe('/other/x.jpg');
  });
});
