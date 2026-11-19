import { describe, expect, it } from 'vitest';
import { resolvePostLoginTarget } from './post-login-target';

/**
 * Post-login landing: explicit redirect wins; the module the user last chose
 * wins over the chooser; a single available module goes straight to its
 * dashboard; otherwise the module chooser grid.
 */
describe('resolvePostLoginTarget', () => {
  it('an explicit redirect URL wins', () => {
    expect(resolvePostLoginTarget('/rxsoft/items', ['rxsoft', 'lis'], null)).toBe('/rxsoft/items');
  });

  it('absolute redirect URLs are normalized to path + search', () => {
    expect(
      resolvePostLoginTarget('https://app.example.com/rxsoft/sales?tab=recent', ['rxsoft'], null)
    ).toBe('/rxsoft/sales?tab=recent');
  });

  it('relative redirects without a leading slash still resolve', () => {
    expect(resolvePostLoginTarget('rxsoft/items', ['rxsoft'], null)).toBe('/rxsoft/items');
  });

  it('an explicit redirect wins over a remembered module', () => {
    expect(resolvePostLoginTarget('/lis/dashboard', ['rxsoft', 'lis'], 'rxsoft')).toBe(
      '/lis/dashboard'
    );
  });

  it('a remembered module the user still has access to skips the chooser', () => {
    expect(resolvePostLoginTarget(undefined, ['rxsoft', 'lis', 'emr'], 'lis')).toBe(
      '/lis/dashboard'
    );
  });

  it('a remembered module the user cannot access is ignored', () => {
    expect(resolvePostLoginTarget(undefined, ['rxsoft', 'lis'], 'emr')).toBe('/modules');
  });

  it('a single module skips the chooser and lands on its dashboard', () => {
    // Module dashboards are file routes on the pathless `_authenticated`
    // layout, so the router path is the bare module root.
    expect(resolvePostLoginTarget(undefined, ['lis'], null)).toBe('/lis/dashboard');
    expect(resolvePostLoginTarget(undefined, ['rxsoft'], null)).toBe('/rxsoft/dashboard');
  });

  it('multiple modules with no remembered selection land on the chooser grid', () => {
    expect(resolvePostLoginTarget(undefined, ['rxsoft', 'lis', 'emr'], null)).toBe('/modules');
  });

  it('no modules and no redirect also lands on the chooser (shows the empty state)', () => {
    expect(resolvePostLoginTarget(undefined, [], null)).toBe('/modules');
  });
});
