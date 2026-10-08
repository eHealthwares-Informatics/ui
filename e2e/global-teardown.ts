import { readOrgState, deprovisionOrganization } from './utils/provision';

/** Tears down the provisioned fresh organisation after the run completes. */
export default async function globalTeardown(): Promise<void> {
  const org = readOrgState();
  if (!org?.organizationCode) {
    return;
  }
  try {
    const deprovisioned = await deprovisionOrganization(org.organizationCode);
    if (deprovisioned) {
      // eslint-disable-next-line no-console
      console.log(`[global-teardown] deprovisioned ${org.organizationCode}`);
    } else {
      // Non-2xx or `deprovisioned:false` — never block the exit on it (seed#12).
      // eslint-disable-next-line no-console
      console.warn(
        `[global-teardown] deprovision NOT confirmed for ${org.organizationCode} ` +
          '(seed answered non-2xx or deprovisioned:false) — org may remain provisioned'
      );
    }
  } catch (err) {
    // Cleaning up lazily is fine — the org is unique per run so nothing breaks.
    // eslint-disable-next-line no-console
    console.warn(
      `[global-teardown] deprovisioning ${org.organizationCode} failed: ${(err as Error).message}`
    );
  }
}
