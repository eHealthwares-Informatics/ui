import { describe, expect, it } from 'vitest';
import { deriveVisibleModules } from './module-derivation';

const backend = (ids: string[]) =>
  ids.map((id) => ({ id, name: id, description: id, root: `/${id}` }));

describe('deriveVisibleModules', () => {
  it('derives the Website Console from the granted rxsoft parent module', () => {
    const modules = deriveVisibleModules(backend(['rxsoft']), ['rxsoft.*']);
    expect(modules.map((m) => m.id)).toEqual(['rxsoft', 'admin', 'website']);
    expect(modules.at(-1)).toMatchObject({
      id: 'website',
      name: 'Website Console',
      root: '/website/dashboard',
    });
  });

  it('derives the Admin Console from a compressed rxsoft.* grant', () => {
    // The admin role holds `rxsoft.admin.*`, but login compresses it to
    // `rxsoft.*` — the switcher must still offer Admin.
    const modules = deriveVisibleModules(backend(['rxsoft']), ['rxsoft.*']);
    expect(modules.map((m) => m.id)).toContain('admin');
    expect(modules.find((m) => m.id === 'admin')).toMatchObject({
      name: 'Admin Console',
      root: '/admin/dashboard',
    });
  });

  it('derives the Admin Console from a concrete rxsoft.admin grant', () => {
    const modules = deriveVisibleModules(backend(['rxsoft']), [
      'rxsoft.admin.settings.read',
    ]);
    expect(modules.map((m) => m.id)).toContain('admin');
  });

  it('does not derive the Admin Console for catalog-only grants', () => {
    const modules = deriveVisibleModules(backend(['rxsoft']), ['rxsoft.catalog.*']);
    expect(modules.map((m) => m.id)).not.toContain('admin');
  });

  it('derives website from a concrete rxsoft.website permission', () => {
    const modules = deriveVisibleModules(backend(['rxsoft']), ['rxsoft.website.content.read']);
    expect(modules.map((m) => m.id)).toContain('website');
  });

  it('does not derive website for unrelated rxsoft grants', () => {
    const modules = deriveVisibleModules(backend(['rxsoft']), ['rxsoft.catalog.item.read']);
    expect(modules.map((m) => m.id)).not.toContain('website');
  });

  it('does not derive website when the rxsoft parent module is absent', () => {
    const modules = deriveVisibleModules(backend(['lis']), ['lis.*', 'rxsoft.*']);
    expect(modules.map((m) => m.id)).toEqual(['lis']);
  });

  it('does not derive a different backend service (identity) from rxsoft', () => {
    const modules = deriveVisibleModules(backend(['rxsoft']), ['rxsoft.*']);
    expect(modules.map((m) => m.id)).not.toContain('identity');
  });

  it('keeps the backend list untouched and does not duplicate', () => {
    const input = backend(['rxsoft', 'website']);
    const modules = deriveVisibleModules(input, ['rxsoft.*', 'website.*']);
    expect(modules.map((m) => m.id)).toEqual(['rxsoft', 'website', 'admin']);
    expect(modules[0]).toBe(input[0]);
    expect(modules[1]).toBe(input[1]);
  });
});
