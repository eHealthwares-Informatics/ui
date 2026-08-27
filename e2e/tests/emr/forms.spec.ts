import { expect } from '@playwright/test';
import { test } from '../../support/emr-fixture';
import { installEmrMocks, type EmrMockForm } from '../../support/emr-mocks';

const forms: EmrMockForm[] = [
  {
    id: 'form-1',
    code: 'VITALS',
    name: 'Vitals',
    category: 'VITALS',
    version: 2,
    schemaJson: { fields: [{ key: 'bp', label: 'Blood pressure', type: 'text' }] },
    isPublished: true,
    publishedVersion: 2,
  },
];

const draftForm: EmrMockForm = {
  id: 'form-2',
  code: 'ASSESSMENT',
  name: 'Assessment',
  category: 'ASSESSMENT',
  version: 1,
  schemaJson: { fields: [{ key: 'findings', label: 'Findings', type: 'textarea' }] },
  isPublished: false,
  publishedVersion: null,
};

test('publishes and unpublishes a form definition (UC-25/26)', async ({ page }) => {
  const posts: { method: string; url: string; body: unknown }[] = [];
  await installEmrMocks(page, {
    forms: [forms[0], draftForm],
    onRequest: (method, url, body) => {
      if (method === 'POST') {
        posts.push({ method, url, body });
      }
    },
  });
  await page.goto('/emr/forms');

  // Rows: [Vitals (published), Assessment (draft)] — row actions live in a menu.
  // Publish the draft (second row)
  await page.getByRole('button', { name: 'Form actions' }).nth(1).click();
  await page.getByRole('menuitem', { name: 'Publish' }).click();
  await expect(page.getByText('Form published')).toBeVisible();
  expect(
    posts.some((post) => post.url.endsWith('/form-definitions/form-2/publish')),
  ).toBe(true);

  // Unpublish the published one (first row)
  await page.getByRole('button', { name: 'Form actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Unpublish' }).click();
  await expect(page.getByText('Form unpublished')).toBeVisible();
  expect(
    posts.some((post) => post.url.endsWith('/form-definitions/form-1/unpublish')),
  ).toBe(true);
});

test('builds and saves a new form definition (UC-24 form builder)', async ({ page }) => {
  const posts: { method: string; url: string; body: unknown }[] = [];
  await installEmrMocks(page, {
    forms,
    onRequest: (method, url, body) => {
      if (method === 'POST') {
      posts.push({ method, url, body });
    }
    },
  });
  await page.goto('/emr/forms');

  // Existing form is listed (name also appears in badges/preview)
  await expect(page.getByText('Vitals').first()).toBeVisible();

  await page.getByRole('button', { name: 'New Form' }).click();

  // Modal basics
  await page.getByLabel('Name').fill('Clinical Note');
  await page.getByLabel('Code').fill('CLINICAL_NOTE');
  await page.getByPlaceholder('Select category').click();
  await page.getByRole('option', { name: 'Clinical Note' }).click();

  // Add one field in the visual editor
  await page.getByRole('button', { name: 'Add field' }).click();
  await page.getByLabel('Label').fill('Chief complaint');
  await page.getByLabel('Key').fill('chiefComplaint');

  await page.getByRole('button', { name: 'Create Form' }).click();

  await expect(page.getByText('Form definition created (draft)')).toBeVisible();

  const createPost = posts.find((post) => post.url.endsWith('/form-definitions'));
  expect(createPost).toBeTruthy();
  const body = createPost!.body as {
    code: string;
    name: string;
    category: string;
    schemaJson: { fields: { key: string; label: string; type: string }[] };
  };
  expect(body.code).toBe('CLINICAL_NOTE');
  expect(body.name).toBe('Clinical Note');
  expect(body.category).toBe('CLINICAL_NOTE');
  expect(body.schemaJson.fields).toHaveLength(1);
  expect(body.schemaJson.fields[0]).toMatchObject({
    key: 'chiefComplaint',
    label: 'Chief complaint',
    type: 'text',
  });
});
