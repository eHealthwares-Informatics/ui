import { describe, expect, it } from 'vitest';
import { resolvePostLoginTarget } from './post-login-target';

/**
 * Post-login landing: explicit redirect wins; a single available module goes
 * straight to its dashboard; otherwise the module chooser grid.
 */
describe('resolvePostLoginTarget', () => {
  it('an explicit redirect URL wins', () => {
    expect(resolvePostLoginTarget('/rxsoft/items', ['rxsoft', 'lis'])).toBe('/rxsoft/items');
  });

  it('absolute redirect URLs are normalized to path + search', () => {
    expect(
      resolvePostLoginTarget('https://app.example.com/rxsoft/sales?tab=recent', ['rxsoft'])
    ).toBe('/rxsoft/sales?tab=recent');
  });

  it('relative redirects without a leading slash still resolve', () => {
    expect(resolvePostLoginTarget('rxsoft/items', ['rxsoft'])).toBe('/rxsoft/items');
  });

  it('a single module skips the chooser and lands on its dashboard', () => {
    // Module dashboards are file routes under the pathless `_authenticated`
    // layout, so the router expects the full route id — the bare
    // `/lis/dashboard` string did not match a route and 404'd after login.
    expect(resolvePostLoginTarget(undefined, ['lis'])).toBe('/_authenticated/lis/dashboard');
    expect(resolvePostLoginTarget(undefined, ['rxsoft'])).toBe(
      '/_authenticated/rxsoft/dashboard'
    );
  });

  it('multiple modules land on the module chooser grid', () => {
    expect(resolvePostLoginTarget(undefined, ['rxsoft', 'lis', 'emr'])).toBe('/modules');
  });

  it('no modules and no redirect also lands on the chooser (shows the empty state)', () => {
    expect(resolvePostLoginTarget(undefined, [])).toBe('/modules');
  });
});
