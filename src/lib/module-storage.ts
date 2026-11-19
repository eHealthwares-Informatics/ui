/**
 * The module the user last chose. Persisted so a returning login (no explicit
 * `?redirect=`) goes straight to that module's dashboard instead of the
 * chooser, and so a fresh tab can restore the module context.
 *
 * Keep this key in one place — the module provider, the `/modules` chooser,
 * the `/$moduleId` route guards and the post-login resolver all share it.
 */
export const SELECTED_MODULE_STORAGE_KEY = 'rxsoft_admin_selected_module';

export function readSelectedModuleId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(SELECTED_MODULE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeSelectedModuleId(moduleId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(SELECTED_MODULE_STORAGE_KEY, moduleId);
  } catch {
    /* storage unavailable — the in-memory context still tracks the selection */
  }
}

export function clearSelectedModuleId(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(SELECTED_MODULE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
