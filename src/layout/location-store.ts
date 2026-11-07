import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * The location the console is working in, chosen from the header switcher.
 *
 * Locations are scoped per location *kind* (`stock` for RxSoft stock locations,
 * `site` for identity/EMR sites) because the ids come from different services
 * and must never be shared across modules.
 *
 * An empty entry means "follow the account", i.e. the location on the signed-in
 * user's profile (the `locationId` claim). Choosing a location overrides it and
 * survives reloads like the other UI preferences.
 */
type LocationState = {
  byScope: Record<string, string>;
  setLocation: (scope: string, locationId: string | null) => void;
  clearScope: (scope: string) => void;
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      byScope: {},
      setLocation: (scope, locationId) =>
        set((state) => {
          const byScope = { ...state.byScope };
          if (locationId) {
            byScope[scope] = locationId;
          } else {
            delete byScope[scope];
          }
          return { byScope };
        }),
      clearScope: (scope) =>
        set((state) => {
          const byScope = { ...state.byScope };
          delete byScope[scope];
          return { byScope };
        }),
    }),
    { name: 'rxsoft-active-location', version: 2 }
  )
);

/** The effective location for a scope: the picked one, else the account location. */
export function useActiveLocationId(
  scope: string,
  accountLocationId?: string | null
): string | null {
  const picked = useLocationStore((state) => state.byScope[scope]);
  return picked ?? accountLocationId ?? null;
}
