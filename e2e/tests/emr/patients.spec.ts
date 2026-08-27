import { expect } from '@playwright/test';
import { test } from '../../support/emr-fixture';
import { installEmrMocks, type EmrMockPatient } from '../../support/emr-mocks';

const patients: EmrMockPatient[] = [
  {
    id: 'patient-1',
    patientId: 'MRN-100',
    firstName: 'Ada',
    lastName: 'Obi',
    gender: 'FEMALE',
    dateOfBirth: '1990-04-12',
    phone: '0801111111',
    isActive: true,
  },
  {
    id: 'patient-2',
    patientId: 'MRN-101',
    firstName: 'Ben',
    lastName: 'Okoro',
    gender: 'MALE',
    dateOfBirth: '1985-01-30',
    phone: '0802222222',
    isActive: true,
  },
];

test('lists patients from the API and deep-links to a profile', async ({ page }) => {
  await installEmrMocks(page, { patients });
  await page.goto('/emr/patients');

  await expect(page.getByText('MRN-100')).toBeVisible();
  await expect(page.getByText('Ada Obi')).toBeVisible();
  await expect(page.getByText('Ben Okoro')).toBeVisible();
  await expect(page.getByText('2 records')).toBeVisible();

  await page.getByText('Ada Obi').click();
  await expect(page).toHaveURL(/\/emr\/patients\/patient-1$/);
  // Profile page shell with its tabs
  await expect(page.getByRole('tab', { name: 'Documentation' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Requests' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Encounters' })).toBeVisible();
});

test('jumps straight to a profile from the sidebar MRN lookup (UC-05 by-mrn)', async ({ page }) => {
  await installEmrMocks(page, { patients });
  await page.goto('/emr/patients');

  const lookup = page.getByPlaceholder('Find patient by MRN…');
  await lookup.fill('MRN-100');
  await lookup.press('Enter');

  await expect(page).toHaveURL(/\/emr\/patients\/patient-1$/);
  await expect(page.getByRole('tab', { name: 'Documentation' })).toBeVisible();
});

test('registers a new patient (UC-01 register patient)', async ({ page }) => {
  const posts: { method: string; url: string; body: unknown }[] = [];
  await installEmrMocks(page, {
    patients,
    onRequest: (method, url, body) => {
      if (method === 'POST') {
      posts.push({ method, url, body });
    }
    },
  });
  await page.goto('/emr/patients');

  // The header action and the modal submit share the label; target the header one.
  await page.getByRole('button', { name: 'Register Patient' }).first().click();
  await page.getByLabel('First name').fill('Zainab');
  await page.getByLabel('Last name').fill('Yusuf');
  await page.getByLabel('Phone').fill('0803333333');
  await page.getByRole('button', { name: 'Register Patient' }).last().click();

  await expect(page.getByText('Patient registered successfully')).toBeVisible();

  const createPost = posts.find((post) => post.url.endsWith('/patients'));
  expect(createPost).toBeTruthy();
  expect(createPost!.body).toMatchObject({
    firstName: 'Zainab',
    lastName: 'Yusuf',
    phone: '0803333333',
  });
});
