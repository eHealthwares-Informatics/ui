import { expect } from '@playwright/test';
import { test } from '../../support/emr-fixture';
import { installEmrMocks, type EmrMockEncounter, type EmrMockForm } from '../../support/emr-mocks';

const encounter: EmrMockEncounter = {
  id: 'enc-1',
  encounterNumber: 'ENC-100',
  patientId: 'patient-1',
  patientName: 'Ada Obi',
  encounterType: 'CONSULTATION',
  encounterDatetime: '2026-08-18T09:00:00Z',
  status: 'ONGOING',
  reason: 'Chest pain',
};

const forms: EmrMockForm[] = [
  {
    id: 'form-1',
    code: 'CLINICAL_NOTE',
    name: 'Clinical Note',
    description: 'Standard consultation note',
    category: 'CLINICAL_NOTE',
    version: 1,
    schemaJson: {
      fields: [{ key: 'note', label: 'Clinical note', type: 'text', required: true }],
    },
    isPublished: true,
    publishedVersion: 1,
  },
];

const submission = {
  id: 'sub-1',
  submissionNumber: 'SUB-100',
  formDefinitionId: 'form-1',
  formName: 'Clinical Note',
  formVersion: 1,
  patientId: 'patient-1',
  encounterId: 'enc-1',
  dataJson: { note: 'Initial note' },
  status: 'SUBMITTED',
  submittedAt: '2026-08-18T10:00:00Z',
  submittedByName: 'dr.ade',
};

test('amends a submission from the encounter documentation tab (UC-32 amend)', async ({ page }) => {
  const posts: { method: string; url: string; body: unknown }[] = [];
  await installEmrMocks(page, {
    encounters: [encounter],
    forms,
    submissions: [submission],
    onRequest: (method, url, body) => {
      if (method === 'POST') {
        posts.push({ method, url, body });
      }
    },
  });
  await page.goto('/emr/encounters/enc-1');

  await page.getByRole('tab', { name: /Documentation/ }).click();
  await expect(page.getByText('SUB-100').first()).toBeVisible();

  await page.getByRole('button', { name: 'Amend' }).click();
  // Pre-filled dynamic form; amend the field and save
  await page.getByLabel('Clinical note').fill('Updated note after review');
  await page.getByRole('button', { name: 'Save Amendment' }).click();

  await expect(page.getByText('Documentation amended')).toBeVisible();

  const amendPost = posts.find((post) => post.url.endsWith('/form-submissions/sub-1/amend'));
  expect(amendPost).toBeTruthy();
  expect(amendPost!.body).toMatchObject({
    dataJson: { note: 'Updated note after review' },
  });
});

test('submits documentation against the active encounter (UC-30 documentation popup)', async ({ page }) => {
  const posts: { method: string; url: string; body: unknown }[] = [];
  await installEmrMocks(page, {
    encounters: [encounter],
    forms,
    onRequest: (method, url, body) => {
      if (method === 'POST') {
      posts.push({ method, url, body });
    }
    },
  });
  await page.goto('/emr/encounters/enc-1');

  // Encounter header (the number also appears in breadcrumbs/tabs)
  await expect(page.getByText('ENC-100').first()).toBeVisible();

  await page.getByRole('button', { name: 'Create Documentation' }).click();

  // The popup lists accessible published forms (name also renders in the selected panel)
  await page.getByText('Clinical Note', { exact: true }).first().click();

  // Patient is pre-filled from the active encounter; fill the form field
  await page.getByLabel('Clinical note').fill('Patient reports intermittent chest pain');

  await page.getByRole('button', { name: 'Submit Documentation' }).click();
  await expect(page.getByText('Documentation submitted successfully')).toBeVisible();

  const createPost = posts.find((post) => post.url.endsWith('/form-submissions'));
  expect(createPost).toBeTruthy();
  expect(createPost!.body).toMatchObject({
    formDefinitionId: 'form-1',
    patientId: 'patient-1',
    encounterId: 'enc-1',
    status: 'SUBMITTED',
    dataJson: { note: 'Patient reports intermittent chest pain' },
  });
});
