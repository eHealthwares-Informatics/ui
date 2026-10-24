/** Shared POS access rule — used by the route guard and the quick-login gate. */
export function hasPosPermission(permissions: string[], roles: string[]): boolean {
  if (roles.includes('super_admin') || roles.includes('admin')) {
    return true;
  }
  return permissions.some(
    (p) =>
      p === 'shop.pos' ||
      p === 'shop.*' ||
      p === 'rxsoft.*' ||
      p.startsWith('shop.pos.') ||
      (p.endsWith('.*') && p.startsWith('shop.'))
  );
}
