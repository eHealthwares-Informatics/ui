import { expect } from '@playwright/test';
import { test } from '../../support/emr-fixture';
import { installEmrMocks, type EmrMockPatient } from '../../support/emr-mocks';

const patient: EmrMockPatient = {
  id: 'patient-1',
  patientId: 'MRN-100',
  firstName: 'Ada',
  lastName: 'Obi',
  gender: 'FEMALE',
  isActive: true,
};

test('schedules an appointment for a patient (UC-10 schedule appointment)', async ({ page }) => {
  const posts: { method: string; url: string; body: unknown }[] = [];
  await installEmrMocks(page, {
    patients: [patient],
    onRequest: (method, url, body) => {
      if (method === 'POST') {
        posts.push({ method, url, body });
      }
    },
  });
  await page.goto('/emr/appointments');

  await page.getByRole('button', { name: 'Schedule Appointment' }).first().click();

  // Searchable patient picker
  await page.getByPlaceholder('Search by name or MRN').click();
  await page.getByPlaceholder('Search by name or MRN').fill('Ada');
  await page.getByRole('option', { name: 'MRN-100 · Ada Obi' }).click();

  await page.getByPlaceholder('Select type').click();
  await page.getByRole('option', { name: 'Consultation' }).click();
  // Priority defaults to ROUTINE in the form — leave it untouched (clicking an
  // already-selected Mantine option would clear it).

  await page.getByRole('dialog').getByLabel('Date').fill('2026-08-25');
  await page.getByRole('dialog').getByLabel('Start time').fill('09:30');

  await page.getByRole('button', { name: 'Schedule Appointment' }).last().click();
  await expect(page.getByText('Appointment scheduled')).toBeVisible();

  const createPost = posts.find((post) => post.url.endsWith('/appointments'));
  expect(createPost).toBeTruthy();
  expect(createPost!.body).toMatchObject({
    patientId: 'MRN-100',
    patientName: 'Ada Obi',
    appointmentType: 'CONSULTATION',
    date: '2026-08-25',
    startTime: '09:30',
    priority: 'ROUTINE',
  });
});

test('filters appointments by patient via the column filter pattern', async ({ page }) => {
  const urls: string[] = [];
  await installEmrMocks(page, {
    appointments: [
      {
        id: 'a1',
        appointmentNumber: 'APT-100',
        patientId: 'MRN-100',
        patientName: 'Ada Obi',
        appointmentType: 'CONSULTATION',
        date: '2026-08-25',
        startTime: '09:30',
        priority: 'ROUTINE',
        status: 'SCHEDULED',
      },
    ],
    onRequest: (method, url) => {
      if (method === 'GET') {
        urls.push(url);
      }
    },
  });
  await page.goto('/emr/appointments');

  await page.getByRole('button', { name: 'Filter by Patient' }).first().click();
  await page.getByRole('menuitem', { name: 'Fuzzy match' }).click();
  await page.getByLabel('Value').fill('ada');
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect
    .poll(() =>
      urls.some(
        (url) =>
          url.includes('/api/appointments') &&
          url.includes('patientName=FUZZY_MATCH%7Cada%7C'),
      ),
    )
    .toBe(true);
});
