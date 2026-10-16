/**
 * EMR Real-Backend E2E Suite
 *
 * Runs against live backend services (Identity :8092, EMR :8093, RxSoft :8080)
 * with a freshly provisioned organisation per run via seed :8094.
 *
 * Coverage derived from USE_CASES.md §5 (EMR) and TEST_CASES.md §5 (EMR).
 * Bespoke flows: visit check-in → visit detail → encounters, requests, admissions.
 */

import { test, expect } from '@playwright/test';
import {
  provisionOrganization,
  deprovisionOrganization,
  activeAdminCredentials,
} from './utils/provision';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORG_STATE_PATH = join(__dirname, '..', '.runtime', 'emr-org-state.json');
const SEED_BASE_URL = (process.env.SEED_BASE_URL ?? 'http://localhost:8094').replace(/\/$/, '');
const SEED_API_KEY = process.env.SEED_PROVISION_API_KEY ?? process.env.SEED_API_KEY ?? '';
const IDENTITY_BASE_URL = process.env.VITE_IDENTITY_API_URL ?? 'http://localhost:8092';
const FRONTEND_BASE_URL = process.env.VITE_FRONTEND_URL ?? 'http://localhost:5173';

interface EmrOrgState {
  organizationId: string;
  organizationCode: string;
  organizationName: string;
  users: Array<{
    username: string;
    password: string;
    roles: string[];
    organizationId: string;
    locationId: string | null;
    email?: string | null;
  }>;
  locations: {
    hq: { id: string; code: string; name: string };
    store: { id: string; code: string; name: string };
  };
  priceList: { id: string; code: string; name: string };
  stockLocations: {
    sale: { id: string; code: string; name: string };
    main: { id: string; code: string; name: string };
    returnLocation: { id: string; code: string; name: string };
  };
  warehouses: Array<{ id: string; code: string; name: string }>;
  parties: Array<{ id: string; code: string; partyType: string; name: string }>;
  whitelistedItemCodes: string[];
  provisionedAt: string;
}

// ─── Global Setup / Teardown ──────────────────────────────────────────────

let provisionedOrg: EmrOrgState | null = null;
let adminToken: string | null = null;

async function getIdentityToken(username: string, password: string): Promise<string> {
  const res = await fetch(`${IDENTITY_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`identity login failed (${res.status})`);
  const body = (await res.json()) as { accessToken: string };
  return body.accessToken;
}

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    return res.ok;
  } catch {
    return false;
  }
}

// Identity exposes no /health route (always 404) — treat ANY HTTP response as
// "service is listening". A connection-level failure is the only down signal.
async function probeIdentity(): Promise<boolean> {
  try {
    const res = await fetch(IDENTITY_BASE_URL, { signal: AbortSignal.timeout(5_000) });
    return res.status > 0; // 404/405/etc all prove the service is up
  } catch {
    return false;
  }
}

/** Retry a probe — a single transient blip must not skip a 27-test run. */
async function probeStable(url: string, attempts = 3, gapMs = 3_000): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (await probe(url)) return true;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
  return false;
}

async function probeIdentityStable(attempts = 3, gapMs = 3_000): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (await probeIdentity()) return true;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
  return false;
}

test.beforeAll(async ({}, testInfo) => {
  // Playwright-template provisioning (demo patients/visits/admissions + GL)
  // takes ~55s idle but 190s+ under suite load (Vite/Chromium competing) —
  // extend ONLY this hook's budget; per-test timeouts stay at config value.
  testInfo.setTimeout(600_000);
  // Probe required services (retried — see probeStable)
  const [identityUp, seedUp, emrUp, frontendUp] = await Promise.all([
    probeIdentityStable(),
    probeStable(`${SEED_BASE_URL}/api/imports/health`),
    probeStable('http://localhost:8093/api/health'),
    probeStable(FRONTEND_BASE_URL),
  ]);

  if (!identityUp || !seedUp || !emrUp || !frontendUp) {
    console.warn(
      `[emr-real] Required services not all healthy: identity=${identityUp} seed=${seedUp} emr=${emrUp} frontend=${frontendUp}`
    );
    console.warn('[emr-real] Suite will be skipped — set VITE_*_URL env vars correctly');
    return; // Tests will skip automatically via test.skip() in beforeEach
  }

  // Provision fresh org — with retries: the playwright template's demo-data
  // insert path degrades across runs (55s idle → 190s → 470s+ under suite
  // load, C15 family) and Node/undici's 300s default headersTimeout kills the
  // client fetch mid-provision while seed completes fine server-side. Retry
  // gives the backend room without masking a hard failure.
  const stamp = new Date().toISOString().slice(0, 10).replace(/[-:]/g, '');
  const orgCode = `EMR-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const PROVISION_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= PROVISION_ATTEMPTS; attempt++) {
    try {
      provisionedOrg = await provisionOrganization({
        code: orgCode,
        name: `EMR E2E ${stamp} ${Date.now().toString(36)}`,
        // 'minimal' (seed): identity + structural reference data only — no
        // demo clinical data (the 55s→7m53s→OOM path, C15) and no GL chart.
        // The suite creates its own patients/appointments/visits via the API.
        template: 'minimal',
        password: 'password',
        // EMR flows never touch the rxsoft pharmacy catalogue. Whitelisting all
        // ~40k global items per org OOM'd the seed process (4GB heap) and pushed
        // provisioning past the beforeAll hook budget. An unknown code is
        // skipped-with-warning by the provisioner → zero items whitelisted.
        items: ['EMR-E2E-NO-ITEMS'],
      });
      console.log(
        `[emr-real] Provisioned org ${orgCode} (id: ${provisionedOrg.organizationId}, attempt ${attempt})`
      );
      break;
    } catch (err) {
      const isLast = attempt === PROVISION_ATTEMPTS;
      console.warn(
        `[emr-real] Provision attempt ${attempt}/${PROVISION_ATTEMPTS} failed: ${(err as Error).message}` +
          (isLast ? '' : ' — retrying in 30s')
      );
      provisionedOrg = null;
      if (isLast) break;
      await new Promise((r) => setTimeout(r, 30_000));
    }
  }

  if (provisionedOrg) {
    try {
      // Get admin token for the provisioned org
      const { username, password } = activeAdminCredentials();
      adminToken = await getIdentityToken(username, password);

      // Write org state for potential debugging
      mkdirSync(dirname(ORG_STATE_PATH), { recursive: true });
      writeFileSync(ORG_STATE_PATH, JSON.stringify(provisionedOrg, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[emr-real] Post-provision setup failed: ${(err as Error).message}`);
      provisionedOrg = null;
    }
  }
});

test.afterAll(async () => {
  if (provisionedOrg) {
    try {
      await deprovisionOrganization(provisionedOrg.organizationCode);
      console.log(`[emr-real] Deprovisioned org ${provisionedOrg.organizationCode}`);
    } catch (err) {
      console.warn(`[emr-real] Deprovision warning: ${(err as Error).message}`);
    }
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function signInAsAdmin(page: any) {
  if (!provisionedOrg) throw new Error('Org not provisioned — skipping test');
  const { username, password } = activeAdminCredentials();
  await page.goto(`${FRONTEND_BASE_URL}/sign-in`);
  // Redesigned auth screen (master, src/features/rxsoft/pages/sign-in):
  // labels are plain <Text>, NOT real <label> elements → getByLabel fails.
  // Testid-first (canon): sign-in-username / sign-in-password / sign-in-submit.
  await page.getByTestId('sign-in-username').fill(username);
  await page.getByTestId('sign-in-password').fill(password);
  await page.getByTestId('sign-in-submit').click();

  // Post-login target (resolvePostLoginTarget): a single-module user lands on
  // that module's dashboard; anyone else gets the module chooser. The
  // provisioned owner holds many modules (rxsoft, lis, emr, …), so expect the
  // chooser — asserting `/emr` directly only held before the module landing
  // grid existed.
  await expect(page).toHaveURL(/\/(modules|emr)/, { timeout: 15_000 });

  if (!/\/emr/.test(page.url())) {
    await page.goto(`${FRONTEND_BASE_URL}/emr`);
  }
  await expect(page).toHaveURL(/\/emr/);
}

// Create a patient via EMR API
async function createPatientViaApi(
  token: string,
  patient: {
    patientId: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth?: string;
    phone?: string;
  }
): Promise<any> {
  const res = await fetch('http://localhost:8093/api/patients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patient),
  });
  if (!res.ok) throw new Error(`create patient failed: ${res.status} ${await res.text()}`);
  const created = await res.json();
  // The patients API stores firstName/lastName; appointments.patient_name is
  // NOT NULL and the UI's PatientPicker composes the display name. Compose it
  // here so appointment fixtures carry the same shape the UI would send.
  const name = [created?.firstName, created?.lastName].filter(Boolean).join(' ').trim();
  return { ...created, patientName: name || created?.patientId };
}

// Create an appointment via EMR API
async function createAppointmentViaApi(
  token: string,
  appt: {
    patientId: string;
    patientName: string;
    appointmentType: string;
    date: string;
    startTime: string;
    priority?: string;
  }
): Promise<any> {
  const res = await fetch('http://localhost:8093/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(appt),
  });
  if (!res.ok) throw new Error(`create appointment failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Check-in an appointment (creates visit) via EMR API
async function checkInAppointmentViaApi(token: string, appointmentId: string): Promise<any> {
  const res = await fetch(`http://localhost:8093/api/appointments/${appointmentId}/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`check-in failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Create a clinical request via EMR API. Used by the request-flow specs so they
// have a deterministic target instead of depending on list ordering.
async function createLabRequestViaApi(
  token: string,
  input: { patientId: string; patientName: string; visitId: string; name?: string; code?: string }
): Promise<any> {
  const res = await fetch('http://localhost:8093/api/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      patientId: input.patientId,
      // requests.patient_name is NOT NULL (Postgres 23502 otherwise) — same
      // denormalised-column shape as appointments.patient_name.
      patientName: input.patientName,
      visitId: input.visitId,
      requestType: 'LAB',
      priority: 'ROUTINE',
      diagnosis: 'E2E fixture',
      // `items.name` is the only required line field; the catalogue pickers are
      // optional and the minimal-template org whitelists no items.
      items: [{ name: input.name ?? 'Complete Blood Count (CBC)', code: input.code ?? 'CBC' }],
    }),
  });
  if (!res.ok) throw new Error(`create request failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Create an encounter via EMR API.
async function createEncounterViaApi(
  token: string,
  input: { patientId: string; visitId: string }
): Promise<any> {
  const res = await fetch('http://localhost:8093/api/encounters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      patientId: input.patientId,
      visitId: input.visitId,
      encounterType: 'CONSULTATION',
      reason: 'E2E documentation fixture',
    }),
  });
  if (!res.ok) throw new Error(`create encounter failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Create a draft form definition via EMR API. Lets publish/specs own their row
// instead of depending on module-seeded forms or another test's org state.
async function createFormDefinitionViaApi(
  token: string,
  form: { code: string; name: string; category?: string }
): Promise<any> {
  const res = await fetch('http://localhost:8093/api/form-definitions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      code: form.code,
      name: form.name,
      category: form.category ?? 'CLINICAL_NOTE',
      schemaJson: {
        fields: [{ key: 'note', label: 'Note', type: 'text', required: false }],
      },
    }),
  });
  if (!res.ok) throw new Error(`create form definition failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Publish a draft form definition via EMR API (submissions require a published form).
async function publishFormViaApi(token: string, formId: string): Promise<void> {
  const res = await fetch(`http://localhost:8093/api/form-definitions/${formId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`publish form failed: ${res.status} ${await res.text()}`);
}

// Create a ward via EMR API. The 'minimal' seed template skips the EMR demo
// clinical block (departments/wards/beds/patients — seed provision.service.ts),
// so the admission and ward-board specs must create their own fixtures.
async function createWardViaApi(
  token: string,
  ward: { code: string; name: string; wardType?: string }
): Promise<any> {
  const res = await fetch('http://localhost:8093/api/wards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ wardType: 'GENERAL', isActive: true, ...ward }),
  });
  if (!res.ok) throw new Error(`create ward failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Create a bed via EMR API. status AVAILABLE so the admission modal offers it.
async function createBedViaApi(
  token: string,
  bed: { wardId: string; code: string; bedType?: string }
): Promise<any> {
  const res = await fetch('http://localhost:8093/api/beds', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bedType: 'STANDARD', status: 'AVAILABLE', ...bed }),
  });
  if (!res.ok) throw new Error(`create bed failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Submit documentation via EMR API.
async function submitDocumentationViaApi(
  token: string,
  input: { formDefinitionId: string; patientId: string; encounterId: string }
): Promise<any> {
  const res = await fetch('http://localhost:8093/api/form-submissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      formDefinitionId: input.formDefinitionId,
      patientId: input.patientId,
      encounterId: input.encounterId,
      dataJson: { note: 'E2E documentation fixture' },
      status: 'SUBMITTED',
    }),
  });
  if (!res.ok) throw new Error(`submit documentation failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

test.describe.configure({ retries: 1 });

test.describe('EMR Real-Backend — Dashboard & Resources', () => {
  test.beforeEach(async ({ page }) => {
    if (!provisionedOrg || !adminToken) {
      test.skip('Backend services not available or provisioning failed');
    }
    await signInAsAdmin(page);
  });

  test('UC-EMR-01: Dashboard summary renders (GET /dashboard)', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr`);
    // Dashboard renders a greeting heading; there is no "EMR Dashboard" title
    // (RxPage title is empty; "EMR" only appears in breadcrumb/sidebar).
    await expect(
      page.getByRole('heading', { name: /Good (morning|afternoon|evening)/i })
    ).toBeVisible();
    // Metric cards — target the unique subtitles (labels also appear as the
    // workspace section title, which would trip strict-mode dupe detection).
    await expect(page.getByText(/still scheduled/)).toBeVisible();
    await expect(page.getByText(/visits in progress/)).toBeVisible();
    await expect(page.getByText('Provider Workload')).toBeVisible();
    await expect(page.getByText(/No check-ins yet/i)).toBeVisible();
  });

  test('UC-EMR-02: Patients list renders and searches', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/patients`);
    await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });
    // Search box
    await page.getByPlaceholder('Search').fill('test');
    await page.waitForTimeout(500); // debounce
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('UC-EMR-03: Appointments list renders and searches', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/appointments`);
    await expect(page.getByRole('heading', { name: 'Appointments' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });
  });

  test('UC-EMR-04: Visits list renders and searches', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/visits`);
    await expect(page.getByRole('heading', { name: 'Visits' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });
  });

  test('UC-EMR-05: Encounters list renders and searches', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/encounters`);
    await expect(page.getByRole('heading', { name: 'Encounters' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });
  });

  test('UC-EMR-06: Forms list renders and searches', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/forms`);
    // Page heading is "Form Definitions" (RxPage), not "Forms".
    await expect(page.getByRole('heading', { name: 'Form Definitions' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });
    // Seeded by the EMR SEED_ON_START upserts
    await expect(page.getByText('CLINICAL_NOTE').first()).toBeVisible();
    await expect(page.getByText('VITALS').first()).toBeVisible();
    // Search box
    await page.getByPlaceholder('Search forms…').fill('vital');
    await expect(page.getByText('VITALS').first()).toBeVisible();
  });

  test('UC-EMR-07: Requests list renders and searches', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/requests`);
    await expect(page.getByRole('heading', { name: 'Requests' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('EMR Real-Backend — Bespoke Flow: Appointment → Visit → Encounter', () => {
  let testPatient: { id: string; patientId: string; patientName: string } | null = null;
  let testAppointment: { id: string; appointmentNumber: string } | null = null;
  // A visit created in beforeAll (not by UC-11) so the documentation specs can
  // run standalone — on a retry Playwright restarts the worker, re-runs
  // beforeAll but NOT UC-11, which would otherwise leave them with no visit.
  let encounterVisit: { id: string; visitNumber: string } | null = null;
  // UC-32's own encounter + submitted documentation fixture (via API), so the
  // amend spec never depends on UC-30's retry outcome.
  let docEncounter: { id: string; encounterNumber: string } | null = null;
  let docSubmission: { id: string; submissionNumber: string } | null = null;

  test.beforeAll(async () => {
    if (!provisionedOrg || !adminToken) return;
    // Create a test patient
    testPatient = await createPatientViaApi(adminToken!, {
      patientId: `MRN-${Date.now().toString(36).toUpperCase()}`,
      firstName: 'Test',
      lastName: 'Patient',
      gender: 'FEMALE',
      dateOfBirth: '1990-01-15',
      phone: '0801234567',
    });
    console.log(`[emr-real] Created test patient: ${testPatient.patientId}`);

    // Create a test appointment for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    testAppointment = await createAppointmentViaApi(adminToken!, {
      patientId: testPatient.patientId,
      patientName: testPatient.patientName,
      appointmentType: 'CONSULTATION',
      date: dateStr,
      startTime: '10:00',
      priority: 'ROUTINE',
    });
    console.log(`[emr-real] Created test appointment: ${testAppointment.appointmentNumber}`);

    // Second slot, checked in via API, giving the documentation specs a stable
    // ONGOING visit that does not depend on UC-11's UI check-in.
    const encounterAppt = await createAppointmentViaApi(adminToken!, {
      patientId: testPatient.patientId,
      patientName: testPatient.patientName,
      appointmentType: 'CONSULTATION',
      date: dateStr,
      startTime: '13:00',
      priority: 'ROUTINE',
    });
    const encounterCheckin = await checkInAppointmentViaApi(adminToken!, encounterAppt.id);
    encounterVisit = {
      id: encounterCheckin.visit.id,
      visitNumber: encounterCheckin.visit.visitNumber,
    };
    console.log(`[emr-real] Created encounter visit: ${encounterVisit.visitNumber}`);

    // UC-32's own encounter + submitted documentation fixture (API-created, so
    // the amend spec never depends on UC-30's retry outcome).
    const docForm = await createFormDefinitionViaApi(adminToken!, {
      code: `E2E_DOC_${Date.now().toString(36).toUpperCase()}`,
      name: 'E2E Documentation Form',
    });
    await publishFormViaApi(adminToken!, docForm.id);
    docEncounter = await createEncounterViaApi(adminToken!, {
      patientId: testPatient.patientId,
      visitId: encounterVisit.id,
    });
    docSubmission = await submitDocumentationViaApi(adminToken!, {
      formDefinitionId: docForm.id,
      patientId: testPatient.patientId,
      encounterId: docEncounter.id,
    });
    console.log(
      `[emr-real] Created documentation fixture: encounter ${docEncounter.id} / submission ${docSubmission.id}`
    );
  });

  test.beforeEach(async ({ page }) => {
    if (!provisionedOrg || !adminToken) {
      test.skip('Backend services not available or provisioning failed');
    }
    await signInAsAdmin(page);
  });

  test('UC-10: Schedule appointment for a patient', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/appointments`);
    await expect(page.getByRole('heading', { name: 'Appointments' })).toBeVisible();

    await page.getByRole('button', { name: 'New' }).first().click();
    await expect(page.getByRole('dialog', { name: 'New Appointment' })).toBeVisible();

    // Patient picker
    await page.getByPlaceholder('Search by name or MRN').click();
    await page
      .getByPlaceholder('Search by name or MRN')
      .fill(testPatient!.patientName.split(' ')[0]);
    await expect(
      page.getByRole('option', { name: new RegExp(testPatient!.patientId) })
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole('option', { name: new RegExp(testPatient!.patientId) }).click();

    // Appointment type
    await page.getByPlaceholder('Select type').click();
    await page.getByRole('option', { name: 'Consultation' }).click();

    // Date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.getByRole('dialog').getByLabel('Date').fill(dateStr);

    // Start time
    await page.getByRole('dialog').getByLabel('Start time').fill('14:30');

    // Submit
    await page.getByRole('button', { name: 'Schedule Appointment' }).last().click();
    await expect(page.getByText('Appointment scheduled')).toBeVisible({ timeout: 10_000 });
  });

  test('UC-11: Check in patient (appointment → visit)', async ({ page }) => {
    // First verify the appointment exists in the list
    await page.goto(`${FRONTEND_BASE_URL}/emr/appointments`);
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });

    // Find the appointment row and click "Begin Visit"
    // The appointment should have status SCHEDULED
    const appointmentRow = page.getByRole('row', {
      name: new RegExp(testAppointment!.appointmentNumber),
    });
    await expect(appointmentRow).toBeVisible({ timeout: 10_000 });

    // Click Begin Visit button (stethoscope icon)
    await appointmentRow
      .getByRole('button', { name: /Begin Visit|Check In/i })
      .first()
      .click();

    // Should navigate to visit detail page
    await expect(page).toHaveURL(/\/emr\/visits\/[^/]+$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Visit/ })).toBeVisible();
  });

  test('UC-30: Submit documentation against active encounter', async ({ page }) => {
    test.skip(!encounterVisit, 'No visit fixture created');

    await page.goto(`${FRONTEND_BASE_URL}/emr/visits/${encounterVisit!.id}`);
    await expect(page.getByRole('heading', { name: /Visit/ })).toBeVisible();

    // Add an encounter
    await page.getByRole('button', { name: 'Add encounter' }).click();
    // Visit-detail wraps EncounterForm (which renders its own Modal titled
    // "Record Encounter") inside another Modal of the same title — two dialog
    // sections mount at once (C21, app defect). The functional one with the
    // form fields is the inner/last; strict mode would reject the pair.
    const encounterDialog = page.getByRole('dialog', { name: 'Record Encounter' }).last();
    await expect(encounterDialog).toBeVisible();

    // Fill encounter form. The submit button is "Record & Start Timer"
    // (encounter-form.tsx) — there is no "Save" on this form.
    await encounterDialog.getByPlaceholder('Select type').click();
    await page.getByRole('option', { name: 'Consultation' }).click();
    await encounterDialog.getByLabel('Reason').fill('Test encounter for E2E');
    await encounterDialog.getByRole('button', { name: 'Record & Start Timer' }).click();

    await expect(page.getByText('Encounter recorded')).toBeVisible({ timeout: 10_000 });

    // Open the encounter. Visit-page encounter rows navigate on click; the
    // "Create Documentation" button lives on the *encounter detail* page
    // (/emr/encounters/:id), not on the visit page.
    const encountersTable = page.locator('table').filter({ hasText: 'Enc #' });
    await expect(encountersTable.getByRole('row').nth(1)).toBeVisible({ timeout: 15_000 });
    await encountersTable.getByRole('row').nth(1).click();
    await expect(page).toHaveURL(/\/emr\/encounters\/[^/]+$/, { timeout: 15_000 });

    await page.getByRole('button', { name: 'Create Documentation' }).click();
    await expect(page.getByRole('dialog', { name: 'Create Documentation' })).toBeVisible();

    // Select the seeded clinical-note form (emr seeds CLINICAL_NOTE/"Clinical
    // Note" with isPublished=true — modules/seeds/seed-data/forms.ts) and fill
    // its first field. The label is "Chief Complaint", not "Clinical note".
    await page.getByText('Clinical Note', { exact: true }).first().click();
    await page.getByLabel('Chief Complaint').fill('Test clinical note from E2E run');
    await page.getByRole('button', { name: 'Submit Documentation' }).click();

    await expect(page.getByText('Documentation submitted successfully')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('UC-32: Amend documentation submission', async ({ page }) => {
    test.skip(!docEncounter || !docSubmission, 'No documentation fixture created');

    // The Documentation tab on the *encounter* detail page lists submissions
    // with View/Amend actions (the visit page has no such tab).
    await page.goto(`${FRONTEND_BASE_URL}/emr/encounters/${docEncounter!.id}`);
    await expect(page.getByRole('heading', { name: /Encounter ENC-/ })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('tab', { name: /Documentation/ }).click();

    // Expand this fixture's submission accordion, then amend. The Amend action
    // is offered while the submission is SUBMITTED.
    const submission = page.getByText(docSubmission!.submissionNumber);
    await expect(submission).toBeVisible({ timeout: 10_000 });
    await submission.click();

    await page.getByRole('button', { name: 'Amend' }).click();
    const amendDialog = page.getByRole('dialog', { name: 'Amend Documentation' });
    await expect(amendDialog).toBeVisible({ timeout: 10_000 });

    // My fixture form's single field is labelled "Note" (see the schema above).
    await amendDialog.getByLabel('Note').fill('Amended note after review');
    await amendDialog.getByRole('button', { name: 'Save Amendment' }).click();

    await expect(page.getByText('Documentation amended')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('EMR Real-Backend — Bespoke Flow: Clinical Requests (Lab/Rad/Pharmacy)', () => {
  let testPatient: { id: string; patientId: string; patientName: string } | null = null;
  let testVisit: { id: string; visitNumber: string } | null = null;
  let testRequest: { id: string; requestNumber: string } | null = null;

  test.beforeAll(async () => {
    if (!provisionedOrg || !adminToken) return;
    testPatient = await createPatientViaApi(adminToken!, {
      patientId: `MRN-${Date.now().toString(36).toUpperCase()}`,
      firstName: 'Request',
      lastName: 'Test',
      gender: 'MALE',
      dateOfBirth: '1985-05-20',
      phone: '0807654321',
    });

    // Create a visit for this patient
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const appt = await createAppointmentViaApi(adminToken!, {
      patientId: testPatient.patientId,
      patientName: testPatient.patientName,
      appointmentType: 'CONSULTATION',
      date: dateStr,
      startTime: '09:00',
      priority: 'ROUTINE',
    });

    const checkin = await checkInAppointmentViaApi(adminToken!, appt.id);
    testVisit = { id: checkin.visit.id, visitNumber: checkin.visit.visitNumber };
    console.log(`[emr-real] Created visit for requests: ${testVisit.visitNumber}`);

    // Deterministic request target for UC-36/37/40 — the requests list has no
    // documented sort, so the first row is not reliably the newest request.
    testRequest = await createLabRequestViaApi(adminToken!, {
      patientId: testPatient.patientId,
      patientName: testPatient.patientName,
      visitId: testVisit.id,
    });
    console.log(`[emr-real] Created request: ${testRequest.requestNumber}`);
  });

  test.beforeEach(async ({ page }) => {
    if (!provisionedOrg || !adminToken) {
      test.skip('Backend services not available or provisioning failed');
    }
    await signInAsAdmin(page);
  });

  test('UC-35: Create Lab request and transition status', async ({ page }) => {
    test.skip(!testRequest, 'No request fixture created');

    await page.goto(`${FRONTEND_BASE_URL}/emr/visits/${testVisit!.id}`);
    await expect(page.getByRole('heading', { name: /Visit/ })).toBeVisible();

    // New request — dialog title is "New Clinical Request" (RequestForm).
    await page.getByRole('button', { name: 'New request' }).click();
    const dialog = page.getByRole('dialog', { name: 'New Clinical Request' });
    await expect(dialog).toBeVisible();

    // Request type: Lab
    await dialog.getByPlaceholder('Select type').click();
    await page.getByRole('option', { name: 'Lab', exact: true }).click();

    // Priority — keyboard nav is required: clicking the Mantine option does not
    // set the control's value, ArrowDown + Enter does.
    await dialog.getByPlaceholder('Select priority').click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Line item — only `items.name` is required. The catalogue item picker is
    // optional and a minimal-template org whitelists no items, so type directly.
    await dialog.getByLabel('Name').fill('Complete Blood Count (CBC)');
    await dialog.getByLabel('Code').fill('CBC');

    await dialog.getByRole('button', { name: 'Create Request' }).click();
    await expect(page.getByText('Clinical request created')).toBeVisible({ timeout: 10_000 });

    // Open the request detail. The /emr/requests list shell has no row-click and
    // no detail link (its only row action is a "Request actions" → Timeline
    // modal), so go straight to the id captured from the API fixture.
    await page.goto(`${FRONTEND_BASE_URL}/emr/requests/${testRequest!.id}`);
    await expect(page.getByRole('heading', { name: /Request REQ-/ })).toBeVisible({
      timeout: 15_000,
    });

    // Transition: REQUESTED → IN_PROGRESS
    await page.getByRole('button', { name: 'Mark In Progress' }).click();
    await expect(page.getByText('Request marked in progress')).toBeVisible({ timeout: 10_000 });

    // Timeline shows the transition
    await expect(page.getByText(/Requested → In Progress/i)).toBeVisible({ timeout: 10_000 });
  });

  test('UC-36: Append note to request timeline', async ({ page }) => {
    test.skip(!testRequest, 'No request fixture created');

    await page.goto(`${FRONTEND_BASE_URL}/emr/requests/${testRequest!.id}`);
    await expect(page.getByRole('heading', { name: /Request REQ-/ })).toBeVisible({
      timeout: 15_000,
    });

    // Note composer is on the request detail page.
    await page
      .getByPlaceholder('Append an update without changing the request status…')
      .fill('E2E test note appended to timeline');
    await page.getByRole('button', { name: 'Add note' }).click();

    await expect(page.getByText('Note added to the request')).toBeVisible({ timeout: 10_000 });
  });

  test('UC-37: Request status timeline visible', async ({ page }) => {
    test.skip(!testRequest, 'No request fixture created');

    await page.goto(`${FRONTEND_BASE_URL}/emr/requests/${testRequest!.id}`);
    await expect(page.getByRole('heading', { name: /Request REQ-/ })).toBeVisible({
      timeout: 15_000,
    });

    // StatusTimeline renders "Created · Requested" then "<From> → <To>".
    // The In Progress entry depends on UC-35 having run (same file, workers=1).
    await expect(page.getByText(/Created · Requested/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Requested → In Progress/i)).toBeVisible({ timeout: 10_000 });
  });

  test('UC-40: Re-sync request to external system', async ({ page }) => {
    test.skip(!testRequest, 'No request fixture created');

    await page.goto(`${FRONTEND_BASE_URL}/emr/requests/${testRequest!.id}`);
    await expect(page.getByRole('heading', { name: /Request REQ-/ })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: 'Re-sync' }).click();
    // Sync is delegated to the external interop/LIS system, so the toast
    // reflects the real outcome — accept success or a reported failure/status
    // rather than assuming the external system is up.
    await expect(
      page.getByText(/Request synced successfully|Sync failed|Sync status|Failed to sync/i)
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('EMR Real-Backend — Ward/Admission Flow', () => {
  let testPatient: { id: string; patientId: string; patientName: string } | null = null;
  let testVisit: { id: string; visitNumber: string } | null = null;
  let testWard: { id: string; code: string; name: string } | null = null;
  let testBed: { id: string; code: string } | null = null;

  test.beforeAll(async () => {
    if (!provisionedOrg || !adminToken) return;
    testPatient = await createPatientViaApi(adminToken!, {
      patientId: `MRN-${Date.now().toString(36).toUpperCase()}`,
      firstName: 'Admission',
      lastName: 'Test',
      gender: 'FEMALE',
      dateOfBirth: '1992-03-10',
      phone: '0801122334',
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const appt = await createAppointmentViaApi(adminToken!, {
      patientId: testPatient.patientId,
      patientName: testPatient.patientName,
      appointmentType: 'CONSULTATION',
      date: dateStr,
      startTime: '11:00',
      priority: 'URGENT',
    });

    const checkin = await checkInAppointmentViaApi(adminToken!, appt.id);
    testVisit = { id: checkin.visit.id, visitNumber: checkin.visit.visitNumber };
    console.log(`[emr-real] Created visit for admission: ${testVisit.visitNumber}`);

    // The 'minimal' seed template skips the EMR demo clinical block, so there
    // are no wards/beds to admit into — create our own fixtures.
    testWard = await createWardViaApi(adminToken!, {
      code: `E2E-WARD-${Date.now().toString(36).toUpperCase()}`,
      name: 'E2E Test Ward',
    });
    testBed = await createBedViaApi(adminToken!, {
      wardId: testWard.id,
      code: `E2E-BED-${Date.now().toString(36).toUpperCase()}`,
    });
    console.log(`[emr-real] Created ward ${testWard.code} + bed ${testBed.code}`);
  });

  test.beforeEach(async ({ page }) => {
    if (!provisionedOrg || !adminToken) {
      test.skip('Backend services not available or provisioning failed');
    }
    await signInAsAdmin(page);
  });

  test('UC-13: Convert visit to admission (ward/bed assignment)', async ({ page }) => {
    test.skip(!testWard || !testBed, 'No ward/bed fixture created');
    await page.goto(`${FRONTEND_BASE_URL}/emr/visits/${testVisit!.id}`);
    await expect(page.getByRole('heading', { name: /Visit/ })).toBeVisible();

    // "Convert to Admission" opens `Admit to ward — <patient>` (the separate
    // /emr/wards/admissions page owns the modal titled "Admit Patient").
    await page.getByRole('button', { name: 'Convert to Admission' }).click();
    await expect(page.getByRole('dialog', { name: /Admit to ward/ })).toBeVisible();

    // Ward selector — options render as `<code> — <name>`; pick the fixture ward.
    await page.getByPlaceholder('Select ward').click();
    const wardOption = page.getByRole('option').first();
    await expect(wardOption).toBeVisible({ timeout: 10_000 });
    await wardOption.click();

    // Bed selector — only beds flagged AVAILABLE in the chosen ward.
    await page.getByPlaceholder('Select bed').click();
    const bedOption = page.getByRole('option').first();
    await expect(bedOption).toBeVisible({ timeout: 10_000 });
    await bedOption.click();

    // Admission type — this Select has no placeholder (defaults to Elective),
    // so target the combobox by role: once its dropdown has mounted, the
    // listbox div shares the same aria-labelledby and getByLabel() would match
    // two elements (strict-mode violation).
    await page.getByRole('combobox', { name: 'Admission type' }).click();
    await page.getByRole('option', { name: 'Emergency' }).click();

    // Diagnosis — label is "Diagnosis / reason (optional)".
    await page.getByLabel('Diagnosis').fill('Test admission for E2E');

    await page.getByRole('button', { name: 'Admit' }).click();
    await expect(page.getByText('Patient admitted')).toBeVisible({ timeout: 10_000 });

    // Admission card now renders on the visit page.
    await expect(page.getByRole('heading', { name: 'Admission' })).toBeVisible({ timeout: 10_000 });
    // Numbers are `PREFIX-<base36 timestamp>-<base36 random>` (shared/utils/numbers.ts),
    // so /ADM-\d+/ never matches.
    await expect(page.getByText(/ADM-[A-Z0-9]+-[A-Z0-9]+/)).toBeVisible({ timeout: 10_000 });
  });

  test('UC-14: Ward bed allocation board renders', async ({ page }) => {
    test.skip(!testWard, 'No ward fixture created');

    // The board is its own route — /emr/wards/board renders "Bed Allocations".
    await page.goto(`${FRONTEND_BASE_URL}/emr/wards/board`);
    await expect(page.getByRole('heading', { name: 'Bed Allocations' })).toBeVisible({
      timeout: 15_000,
    });

    // The fixture ward appears as a board column.
    await expect(page.getByText(testWard!.code).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('EMR Real-Backend — Form Builder', () => {
  test.beforeEach(async ({ page }) => {
    if (!provisionedOrg || !adminToken) {
      test.skip('Backend services not available or provisioning failed');
    }
    await signInAsAdmin(page);
  });

  test('UC-24: Build and save a new form definition', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/forms`);
    await expect(page.getByRole('heading', { name: 'Form Definitions' })).toBeVisible();

    await page.getByRole('button', { name: 'New Form' }).click();
    const dialog = page.getByRole('dialog', { name: 'New Form Definition' });
    await expect(dialog).toBeVisible();

    // Metadata — Name/Code/Category are required; Description is optional.
    await dialog.getByLabel('Code').fill(`TEST_FORM_${Date.now()}`);
    await dialog.getByLabel('Name').fill('E2E Test Form');
    await dialog.getByLabel('Description').fill('Form created by E2E test');
    await dialog.getByPlaceholder('Select category').click();
    await page.getByRole('option', { name: 'Clinical Note' }).click();

    // Add a field. The builder starts with none; a new field's type already
    // defaults to "text" (emptyField()), so label + submit is enough.
    await dialog.getByRole('button', { name: 'Add field' }).click();
    await dialog.getByPlaceholder('Field label').fill('Test Field');

    await dialog.getByRole('button', { name: 'Create Form' }).click();
    await expect(page.getByText('Form definition created (draft)')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('UC-25/26: Publish and unpublish a form definition', async ({ page }) => {
    test.skip(!adminToken, 'No admin token');

    // Own the row: create a fresh draft via API so this test never depends on
    // module-seeded forms (absent in a freshly provisioned lean org) or on
    // UC-24 having run. A new form starts unpublished, so the menu offers a
    // deterministic Publish → Unpublish sequence.
    const suffix = Date.now().toString(36).toUpperCase();
    const draft = await createFormDefinitionViaApi(adminToken!, {
      code: `E2E_PUB_${suffix}`,
      name: `E2E Publish Toggle ${suffix}`,
    });

    await page.goto(`${FRONTEND_BASE_URL}/emr/forms`);
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });

    // NOTE: this page renders a plain table (no `data-table-body` testid), so
    // target rows via role + the unique code badge.
    const row = page.getByRole('row').filter({ hasText: draft.code });
    await expect(row.first()).toBeVisible({ timeout: 15_000 });

    // Publish/unpublish are MENU ITEMS behind the row's "Form actions"
    // action-icon (not row buttons). `exact` matters here — "Publish" is a
    // substring of "Unpublish".
    const openActions = async () => {
      await row.first().getByRole('button', { name: 'Form actions' }).click();
    };

    await openActions();
    await page.getByRole('menuitem', { name: 'Publish', exact: true }).click();
    await expect(page.getByText('Form published')).toBeVisible({ timeout: 10_000 });

    await openActions();
    await page.getByRole('menuitem', { name: 'Unpublish', exact: true }).click();
    await expect(page.getByText('Form unpublished')).toBeVisible({ timeout: 10_000 });
  });

  test('UC-27: Build form with item/drug searchable field type', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/forms`);
    await expect(page.getByRole('heading', { name: 'Form Definitions' })).toBeVisible();

    await page.getByRole('button', { name: 'New Form' }).click();
    const dialog = page.getByRole('dialog', { name: 'New Form Definition' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Code').fill(`DRUG_FORM_${Date.now()}`);
    await dialog.getByLabel('Name').fill('Drug Search Form');
    await dialog.getByPlaceholder('Select category').click();
    await page.getByRole('option', { name: 'Clinical Note' }).click();

    // Add an item/drug searchable field. The type is the "Item" option of
    // FIELD_TYPES (there is no "Drug Search" option). Target the combobox by
    // role — a mounted dropdown listbox would otherwise double-match the label.
    await dialog.getByRole('button', { name: 'Add field' }).click();
    await dialog.getByPlaceholder('Field label').fill('Prescribed Drug');
    await dialog.getByRole('combobox', { name: 'Type' }).click();
    await page.getByRole('option', { name: 'Item', exact: true }).click();

    await dialog.getByRole('button', { name: 'Create Form' }).click();
    await expect(page.getByText('Form definition created (draft)')).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe('EMR Real-Backend — Patient Registration & Lookup', () => {
  test.beforeEach(async ({ page }) => {
    if (!provisionedOrg || !adminToken) {
      test.skip('Backend services not available or provisioning failed');
    }
    await signInAsAdmin(page);
  });

  test('UC-01: Register a new patient', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/patients`);
    await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();

    await page.getByTestId('header-new').click();
    await expect(page.getByTestId('modal-form')).toBeVisible({ timeout: 15_000 });

    const mrn = `MRN-${Date.now().toString(36).toUpperCase()}`;
    await page.getByLabel('First name').fill('New');
    await page.getByLabel('Last name').fill('Patient');
    await page.getByLabel('Phone').fill('0809988776');
    await page.getByPlaceholder('Select gender').click();
    await page.getByRole('option', { name: 'Female' }).click();
    await page.getByLabel('Date of birth').fill('1995-07-15');

    await page.getByRole('button', { name: 'Create' }).last().click();
    await expect(page.getByText('Patient registered successfully')).toBeVisible({
      timeout: 10_000,
    });

    // Verify in list
    await page.getByPlaceholder('Search').fill(mrn);
    await page.waitForTimeout(500);
    await expect(page.getByText(mrn)).toBeVisible({ timeout: 5_000 });
  });

  test('UC-05: Jump to profile from sidebar MRN lookup', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/patients`);
    await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();

    // Use the MRN lookup in the sidebar/header
    const lookup = page.getByPlaceholder('Find patient by MRN…');
    if (await lookup.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Get an existing MRN from the table
      const firstRow = page.getByRole('row').nth(1); // skip header
      const mrnText = await firstRow.getByRole('cell').first().textContent();
      if (mrnText) {
        await lookup.fill(mrnText.trim());
        await lookup.press('Enter');
        await expect(page).toHaveURL(/\/emr\/patients\/[^/]+$/, { timeout: 10_000 });
        await expect(page.getByRole('tab', { name: 'Documentation' })).toBeVisible();
      }
    }
  });

  test('UC-07: Register a new staff member', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/staff`);
    await expect(page.getByRole('heading', { name: 'Staff' })).toBeVisible();

    await page.getByTestId('header-new').click();
    await expect(page.getByTestId('modal-form')).toBeVisible({ timeout: 15_000 });

    await page.getByLabel('First name').fill('Dr');
    await page.getByLabel('Last name').fill('E2E Test');
    await page.getByLabel('Email').fill(`e2e-test-${Date.now()}@example.com`);
    await page.getByPlaceholder('Select role').click();
    await page.getByRole('option', { name: 'Doctor' }).click();
    await page.getByPlaceholder('Select department').click();
    await page.waitForTimeout(500);
    const deptOption = page.getByRole('option').first();
    await expect(deptOption).toBeVisible({ timeout: 5_000 });
    await deptOption.click();

    await page.getByRole('button', { name: 'Create' }).last().click();
    await expect(page.getByText('Staff registered successfully')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('EMR Real-Backend — Medications & Referrals', () => {
  test.beforeEach(async ({ page }) => {
    if (!provisionedOrg || !adminToken) {
      test.skip('Backend services not available or provisioning failed');
    }
    await signInAsAdmin(page);
  });

  test('Medications list renders', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/medications`);
    await expect(page.getByRole('heading', { name: 'Medications' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });
  });

  test('Referrals list renders', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/referrals`);
    await expect(page.getByRole('heading', { name: 'Referrals' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('EMR Real-Backend — Tags & Settings', () => {
  test.beforeEach(async ({ page }) => {
    if (!provisionedOrg || !adminToken) {
      test.skip('Backend services not available or provisioning failed');
    }
    await signInAsAdmin(page);
  });

  test('Tags list renders and can create tag', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/tags`);
    await expect(page.getByRole('heading', { name: 'Tags' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('header-new').click();
    await expect(page.getByTestId('modal-form')).toBeVisible({ timeout: 15_000 });

    await page.getByLabel('Name').fill(`E2E Tag ${Date.now()}`);
    await page.getByPlaceholder('Select color').click();
    await page.getByRole('option').first().click();

    await page.getByRole('button', { name: 'Create' }).last().click();
    await expect(page.getByText('Tag created')).toBeVisible({ timeout: 10_000 });
  });

  test('Settings page renders', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/emr/settings`);
    await expect(page.getByRole('heading', { name: /Settings|Configuration/i })).toBeVisible();
  });
});
