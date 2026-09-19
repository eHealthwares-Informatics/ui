import { expect } from '@playwright/test';
import { test } from '../../support/emr-fixture';
import { installEmrMocks } from '../../support/emr-mocks';

const wards = [
  {
    id: 'ward-1',
    code: 'W3A',
    name: 'Male General Ward',
    wardType: 'GENERAL',
    departmentType: 'INPATIENT',
    isActive: true,
  },
];

const beds = [
  { id: 'bed-1', wardId: 'ward-1', code: 'B-101', bedType: 'STANDARD', status: 'AVAILABLE' },
  { id: 'bed-2', wardId: 'ward-1', code: 'B-102', bedType: 'STANDARD', status: 'OCCUPIED' },
];

const admissions = [
  {
    id: 'adm-1',
    admissionNumber: 'ADM-100',
    patientId: 'MRN-100',
    patientName: 'Ada Obi',
    wardId: 'ward-1',
    bedId: 'bed-2',
    admissionDatetime: '2026-08-18T09:00:00Z',
    admissionType: 'EMERGENCY',
    status: 'ADMITTED',
  },
];

test('lists wards through the data page shell', async ({ page }) => {
  await installEmrMocks(page, { wards, beds });
  await page.goto('/emr/wards');

  await expect(page.getByText('W3A').first()).toBeVisible();
  await expect(page.getByText('Male General Ward').first()).toBeVisible();
});

test('lists beds and shows the bed allocation board', async ({ page }) => {
  await installEmrMocks(page, { wards, beds });

  await page.goto('/emr/wards/beds');
  await expect(page.getByText('B-101').first()).toBeVisible();
  await expect(page.getByText('B-102').first()).toBeVisible();
  await expect(page.getByText('AVAILABLE').first()).toBeVisible();

  await page.goto('/emr/wards/board');
  await expect(page.getByText('Male General Ward').first()).toBeVisible();
  await expect(page.getByText('B-101').first()).toBeVisible();
});

test('opens admissions through the Wards submenu and lists admissions', async ({ page }) => {
  await installEmrMocks(page, { wards, beds, admissions });
  await page.goto('/emr');

  // The Wards group is a top-level menu — expand it to reveal Admissions.
  await page.getByRole('button', { name: 'Wards Wards' }).click();
  const admissionsLink = page.getByRole('link', { name: 'Admissions' });
  await expect(admissionsLink).toBeVisible();
  await admissionsLink.click();

  await expect(page).toHaveURL(/\/emr\/wards\/admissions/);
  await expect(page.getByRole('button', { name: 'Admit Patient' })).toBeVisible();
  await expect(page.getByText('ADM-100').first()).toBeVisible();
  await expect(page.getByText('Ada Obi').first()).toBeVisible();
});