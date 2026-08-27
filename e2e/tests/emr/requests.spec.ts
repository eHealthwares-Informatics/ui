import { expect } from '@playwright/test';
import { test } from '../../support/emr-fixture';
import { installEmrMocks, type EmrMockRequest } from '../../support/emr-mocks';

const request: EmrMockRequest = {
  id: 'req-1',
  requestNumber: 'REQ-100',
  patientId: 'patient-1',
  patientName: 'Ada Obi',
  requestType: 'LAB',
  status: 'REQUESTED',
  priority: 'ROUTINE',
  syncStatus: 'SYNCED',
  externalOrderId: 'LAB-EXT-9',
  externalReference: 'REF-9',
  requestedAt: '2026-08-18T08:30:00Z',
  items: [{ id: 'item-1', name: 'Full blood count', code: 'CBC' }],
  statusHistory: [
    {
      id: 'h1',
      requestId: 'req-1',
      fromStatus: null,
      toStatus: 'REQUESTED',
      reason: null,
      actorUsername: 'dr.ade',
      createdAt: '2026-08-18T08:30:00Z',
    },
    {
      id: 'h2',
      requestId: 'req-1',
      fromStatus: 'REQUESTED',
      toStatus: 'IN_PROGRESS',
      reason: 'Lab accepted',
      actorUsername: 'lab.tech',
      createdAt: '2026-08-18T09:15:00Z',
    },
  ],
};

test('shows the status timeline on the request detail page (UC-37 timeline)', async ({ page }) => {
  await installEmrMocks(page, { requests: [request] });
  await page.goto('/emr/requests/req-1');

  await expect(page.getByText('REQ-100').first()).toBeVisible();
  // Timeline: creation entry and one transition
  await expect(page.getByText(/Created · Requested/)).toBeVisible();
  await expect(page.getByText(/Requested → In Progress/)).toBeVisible();
  await expect(page.getByText('dr.ade')).toBeVisible();
  await expect(page.getByText('lab.tech')).toBeVisible();
  // External order id is exposed
  await expect(page.getByText('LAB-EXT-9')).toBeVisible();
});

test('re-syncs the request to the external system (UC-40 re-sync)', async ({ page }) => {
  const posts: { method: string; url: string; body: unknown }[] = [];
  await installEmrMocks(page, {
    requests: [request],
    onRequest: (method, url, body) => {
      if (method === 'POST') {
        posts.push({ method, url, body });
      }
    },
  });
  await page.goto('/emr/requests/req-1');

  await page.getByRole('button', { name: 'Re-sync' }).click();
  await expect(page.getByText('Request synced successfully')).toBeVisible();
  expect(
    posts.some((post) => post.url.endsWith('/requests/req-1/sync')),
  ).toBe(true);
});

test('appends a note to the request timeline (UC-36 add note)', async ({ page }) => {
  const posts: { method: string; url: string; body: unknown }[] = [];
  await installEmrMocks(page, {
    requests: [request],
    onRequest: (method, url, body) => {
      if (method === 'POST') {
        posts.push({ method, url, body });
      }
    },
  });
  await page.goto('/emr/requests/req-1');

  await page
    .getByPlaceholder('Append an update without changing the request status…')
    .fill('Patient called to follow up on results');
  await page.getByRole('button', { name: 'Add note' }).click();

  await expect(page.getByText('Note added to the request')).toBeVisible();
  const notePost = posts.find((post) => post.url.endsWith('/requests/req-1/note'));
  expect(notePost).toBeTruthy();
  expect(notePost!.body).toMatchObject({
    note: 'Patient called to follow up on results',
  });
});

test('transitions a request and records it (UC-35 status transition)', async ({ page }) => {
  const posts: { method: string; url: string; body: unknown }[] = [];
  await installEmrMocks(page, {
    requests: [request],
    onRequest: (method, url, body) => {
      if (method === 'POST') {
      posts.push({ method, url, body });
    }
    },
  });
  await page.goto('/emr/requests/req-1');

  await page.getByRole('button', { name: 'Mark In Progress' }).click();

  await expect(page.getByText('Request marked in progress')).toBeVisible();

  const transitionPost = posts.find((post) => post.url.endsWith('/requests/req-1/transition'));
  expect(transitionPost).toBeTruthy();
  expect(transitionPost!.body).toMatchObject({ status: 'IN_PROGRESS' });
});
