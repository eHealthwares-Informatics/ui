import type { Page } from '@playwright/test';

/**
 * In-memory fake backend for EMR E2E tests. Intercepts the identity service
 * (`localhost:8092`) and the EMR API (`localhost:8093/api`) so the full app
 * renders without any backend running.
 */

export type EmrMockPatient = {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
};

export type EmrMockForm = {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  version: number;
  schemaJson: { fields: unknown[] };
  isPublished: boolean;
  publishedVersion?: number | null;
  isActive?: boolean;
};

export type EmrMockEncounter = {
  id: string;
  encounterNumber: string;
  patientId: string;
  patientName: string;
  encounterType: string;
  encounterDatetime: string;
  status?: string;
  reason?: string;
  visitId?: string;
  providerId?: string;
  providerName?: string;
};

export type EmrMockStatusHistory = {
  id: string;
  requestId: string;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  actorUsername: string | null;
  createdAt: string;
};

export type EmrMockRequest = {
  id: string;
  requestNumber: string;
  patientId: string;
  patientName: string;
  requestType: string;
  status: string;
  priority: string;
  syncStatus: string;
  syncError?: string | null;
  externalOrderId?: string | null;
  externalReference?: string | null;
  requestedAt: string;
  completedAt?: string | null;
  items?: unknown[];
  statusHistory?: EmrMockStatusHistory[];
};

export type EmrMockOptions = {
  patients?: EmrMockPatient[];
  forms?: EmrMockForm[];
  encounters?: EmrMockEncounter[];
  requests?: EmrMockRequest[];
  submissions?: unknown[];
  staff?: unknown[];
  appointments?: unknown[];
  visits?: unknown[];
  /** Capture every intercepted request for assertions. */
  onRequest?: (method: string, url: string, body: unknown) => void;
};

function listResponse(data: unknown[], url: URL) {
  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = Number(url.searchParams.get('limit') ?? 20);
  return {
    data,
    meta: { page, limit, total: data.length },
    pagination: { page, limit, total: data.length, totalPages: Math.max(1, Math.ceil(data.length / limit)) },
  };
}

function notFound(route: { fulfill: (opts: object) => Promise<void> }) {
  return route.fulfill({ status: 404, json: { message: 'Not found', statusCode: 404 } });
}

/**
 * Installs identity + EMR API mocks on the page. Call before page.goto().
 */
export async function installEmrMocks(page: Page, opts: EmrMockOptions = {}) {
  // The app decodes JWTs with window.atob; patch it to accept base64url so
  // the synthetic test token (which may contain - and _) always decodes.
  await page.addInitScript(() => {
    const originalAtob = window.atob.bind(window);
    window.atob = (input: string) => originalAtob(input.replace(/-/g, '+').replace(/_/g, '/'));
  });

  // ---- Identity service -------------------------------------------------
  await page.route(/^https?:\/\/localhost:8092\//, async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'GET' && url.pathname === '/auth/me') {
      await route.fulfill({
        json: {
          id: 'user-1',
          username: 'admin',
          roles: ['doctor', 'super_admin'],
          permissions: [],
          modules: [
            { id: 'emr', name: 'EMR', description: 'Electronic Medical Record', root: '/emr' },
            { id: 'lis', name: 'LIS', description: 'Laboratory Information System', root: '/lis' },
            { id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy', root: '/rxsoft' },
          ],
        },
      });
      return;
    }
    await notFound(route);
  });

  // ---- EMR API ----------------------------------------------------------
  await page.route(/^https?:\/\/localhost:8093\/api\//, async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api/, '');
    const body = route.request().postDataJSON?.() ?? null;

    opts.onRequest?.(method, url.pathname, body);

    // --- GET single resources (must precede list + id patterns) ---
    if (method === 'GET') {
      const findById = <T extends { id: string }>(rows: T[] | undefined, id: string): T | null =>
        rows?.find((row) => row.id === id) ?? null;

      // by-mrn lookup
      const mrnMatch = path.match(/^\/patients\/by-mrn\/([^/]+)$/);
      if (mrnMatch) {
        const patient = opts.patients?.find((p) => p.patientId === mrnMatch[1]);
        if (patient) {
          return route.fulfill({ json: patient });
        }
        return notFound(route);
      }

      // single resources with an id segment
      for (const [prefix, rows] of [
        ['/patients', opts.patients ?? []],
        ['/form-definitions', opts.forms ?? []],
        ['/encounters', opts.encounters ?? []],
        ['/requests', opts.requests ?? []],
        ['/staff', opts.staff ?? []],
      ] as const) {
        const match = path.match(new RegExp(`^${prefix}/([^/]+)$`));
        if (match) {
          if (prefix === '/requests') {
            const request = findById(rows as EmrMockRequest[], match[1]);
            if (!request) {
              return notFound(route);
            }
            return route.fulfill({
              json: {
                ...request,
                items: request.items ?? [],
                statusHistory: request.statusHistory ?? [],
              },
            });
          }
          const row = findById(rows as { id: string }[], match[1]);
          if (!row) {
            return notFound(route);
          }
          return route.fulfill({ json: row });
        }
      }

      // request history (lightweight)
      const historyMatch = path.match(/^\/requests\/([^/]+)\/history$/);
      if (historyMatch) {
        const request = opts.requests?.find((r) => r.id === historyMatch[1]);
        return route.fulfill({ json: { data: request?.statusHistory ?? [] } });
      }

      // form submission chain
      const chainMatch = path.match(/^\/form-submissions\/([^/]+)\/chain$/);
      if (chainMatch) {
        const submissions = (opts.submissions ?? []) as { id: string }[];
        return route.fulfill({ json: { data: submissions.filter((s) => s.id === chainMatch[1]) } });
      }

      // submission single (view modal)
      const submissionMatch = path.match(/^\/form-submissions\/([^/]+)$/);
      if (submissionMatch) {
        const row = (opts.submissions ?? []).find((s: { id: string }) => s.id === submissionMatch[1]);
        if (!row) {
          return notFound(route);
        }
        return route.fulfill({ json: row });
      }

      // lists
      switch (path) {
        case '/patients':
          return route.fulfill({ json: listResponse(opts.patients ?? [], url) });
        case '/forms/available':
          // Access-controlled list used by the Documentation popup
          return route.fulfill({
            json: { data: (opts.forms ?? []).filter((form) => form.isPublished) },
          });
        case '/form-definitions':
          return route.fulfill({ json: listResponse(opts.forms ?? [], url) });
        case '/encounters':
          return route.fulfill({ json: listResponse(opts.encounters ?? [], url) });
        case '/requests':
          return route.fulfill({ json: listResponse(opts.requests ?? [], url) });
        case '/staff':
          return route.fulfill({ json: listResponse(opts.staff ?? [], url) });
        case '/appointments':
          return route.fulfill({ json: listResponse(opts.appointments ?? [], url) });
        case '/visits':
          return route.fulfill({ json: listResponse(opts.visits ?? [], url) });
        case '/form-submissions':
          return route.fulfill({ json: listResponse(opts.submissions ?? [], url) });
        default:
          return notFound(route);
      }
    }

    // --- mutations ---
    if (method === 'POST') {
      const publish = path.match(/^\/form-definitions\/([^/]+)\/(publish|unpublish)$/);
      if (publish) {
        const form = opts.forms?.find((f) => f.id === publish[1]);
        if (!form) {
          return notFound(route);
        }
        return route.fulfill({
          json:
            publish[2] === 'publish'
              ? { ...form, isPublished: true, publishedVersion: form.version }
              : { ...form, isPublished: false, publishedVersion: null },
        });
      }

      const transition = path.match(/^\/requests\/([^/]+)\/transition$/);
      if (transition) {
        const request = opts.requests?.find((r) => r.id === transition[1]);
        if (!request) {
          return notFound(route);
        }
        const status = (body as { status?: string })?.status ?? request.status;
        return route.fulfill({
          json: {
            ...request,
            status,
            ...(status === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
          },
        });
      }

      const note = path.match(/^\/requests\/([^/]+)\/note$/);
      if (note) {
        return route.fulfill({
          json: {
            id: `note-${Date.now()}`,
            requestId: note[1],
            fromStatus: null,
            toStatus: null,
            reason: (body as { note?: string })?.note ?? null,
            actorUsername: 'admin',
            createdAt: new Date().toISOString(),
          },
        });
      }

      const sync = path.match(/^\/requests\/([^/]+)\/sync$/);
      if (sync) {
        const request = opts.requests?.find((r) => r.id === sync[1]);
        if (!request) {
          return notFound(route);
        }
        return route.fulfill({
          json: { ...request, syncStatus: 'SYNCED', syncError: null },
        });
      }

      switch (path) {
        case '/patients':
          return route.fulfill({
            json: { ...(body as object), id: `patient-${Date.now()}` },
          });
        case '/form-definitions':
          return route.fulfill({
            json: {
              ...(body as object),
              id: `form-${Date.now()}`,
              version: 1,
              isPublished: false,
              publishedVersion: null,
              isActive: true,
            },
          });
        case '/form-submissions':
          return route.fulfill({
            json: {
              ...(body as object),
              id: `sub-${Date.now()}`,
              submissionNumber: `SUB-${Date.now()}`,
              status: (body as { status?: string })?.status ?? 'SUBMITTED',
            },
          });
        case '/requests':
          return route.fulfill({ json: { ...(body as object), id: `req-${Date.now()}` } });
        default:
          return route.fulfill({ json: { ...(body as object), id: `id-${Date.now()}` } });
      }
    }

    if (method === 'PATCH') {
      return route.fulfill({ json: { ...(body as object), id: path.split('/').pop() ?? 'id' } });
    }

    if (method === 'DELETE') {
      return route.fulfill({ json: { ok: true } });
    }

    await notFound(route);
  });
}
