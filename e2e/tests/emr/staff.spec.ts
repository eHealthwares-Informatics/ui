import { expect } from '@playwright/test';
import { test } from '../../support/emr-fixture';
import { installEmrMocks } from '../../support/emr-mocks';

const staff = [
  {
    id: 'staff-1',
    staffNumber: 'STF-1',
    firstName: 'Ada',
    lastName: 'Obi',
    roleType: 'Doctor',
    category: 'Medical',
    department: 'Cardiology',
    isActive: true,
  },
  {
    id: 'staff-2',
    staffNumber: 'STF-2',
    firstName: 'Ben',
    lastName: 'Okoro',
    roleType: 'Nurse',
    category: 'Nursing',
    department: 'Ward 3',
    isActive: true,
  },
];

test('lists staff members with their roles', async ({ page }) => {
  await installEmrMocks(page, { staff });
  await page.goto('/emr/staff');

  await expect(page.getByText('STF-1').first()).toBeVisible();
  await expect(page.getByText('Ada Obi').first()).toBeVisible();
  await expect(page.getByText('Ben Okoro').first()).toBeVisible();
  await expect(page.getByText('Cardiology')).toBeVisible();
});

test('registers a new staff member (UC-07 register staff)', async ({ page }) => {
  const posts: { method: string; url: string; body: unknown }[] = [];
  await installEmrMocks(page, {
    staff,
    onRequest: (method, url, body) => {
      if (method === 'POST') {
        posts.push({ method, url, body });
      }
    },
  });
  await page.goto('/emr/staff');

  await page.getByRole('button', { name: 'Register Staff' }).first().click();
  await page.getByLabel('First name').fill('Chidi');
  await page.getByLabel('Last name').fill('Eze');
  await page.getByPlaceholder('Select role').click();
  await page.getByRole('option', { name: 'Doctor' }).click();
  await page.getByLabel('Department').fill('Cardiology');
  await page.getByRole('button', { name: 'Register Staff' }).last().click();

  await expect(page.getByText('Staff member registered')).toBeVisible();

  const createPost = posts.find((post) => post.url.endsWith('/staff'));
  expect(createPost).toBeTruthy();
  expect(createPost!.body).toMatchObject({
    firstName: 'Chidi',
    lastName: 'Eze',
    roleType: 'Doctor',
    department: 'Cardiology',
  });
});
