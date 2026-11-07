import { getCookie, setCookie } from '@/lib/cookies';

/**
 * Sidebar states on desktop:
 *  - 'expanded' — full 260px sidebar with labels
 *  - 'rail'     — icon-only rail (the "reduced" form)
 *  - 'hidden'   — sidebar removed entirely, content takes the full width
 *
 * On mobile the sidebar is always a slide-over drawer, so only the open/closed
 * state applies there.
 */
export type NavState = 'expanded' | 'rail' | 'hidden';

const NAV_COOKIE = 'sidebar_state';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function readNavState(): NavState {
  const saved = getCookie(NAV_COOKIE);
  // Older builds stored a boolean-ish value; treat "false" as the rail.
  if (saved === 'false') {
    return 'rail';
  }
  return saved === 'rail' || saved === 'hidden' ? saved : 'expanded';
}

export function writeNavState(state: NavState): void {
  setCookie(NAV_COOKIE, state, COOKIE_MAX_AGE);
}

/** Cycles expanded → rail → hidden → expanded. */
export function nextNavState(state: NavState): NavState {
  if (state === 'expanded') {
    return 'rail';
  }
  if (state === 'rail') {
    return 'hidden';
  }
  return 'expanded';
}
