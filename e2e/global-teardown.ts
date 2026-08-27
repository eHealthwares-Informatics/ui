import { readOrgState, deprovisionOrganization } from './utils/provision';

/** Tears down the provisioned fresh organisation after the run completes. */
export default async function globalTeardown(): Promise<void> {
  const org = readOrgState();
  if (!org?.organizationCode) {
    return;
  }
  try {
    await deprovisionOrganization(org.organizationCode);
    // eslint-disable-next-line no-console
    console.log(`[global-teardown] deprovisioned ${org.organizationCode}`);
  } catch (err) {
    // Cleaning up lazily is fine — the org is unique per run so nothing breaks.
    // eslint-disable-next-line no-console
    console.warn(
      `[global-teardown] deprovisioning ${org.organizationCode} failed: ${(err as Error).message}`,
    );
  }
}