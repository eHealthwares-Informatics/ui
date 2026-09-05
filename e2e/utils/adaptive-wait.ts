import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Adaptive Wait Time System
 *
 * Tracks actual action durations across test runs and computes dynamic
 * timeouts. On fast machines the timeouts shrink so tests fail faster;
 * on slow machines they grow to avoid flaky failures.
 *
 * Data is persisted to a JSON file between runs so the system learns
 * over time. Each action category has a default seed, a p95 target,
 * and decay factor so old slow runs don't dominate.
 */

interface TimingRecord {
  /** Last N durations in ms */
  durations: number[];
  /** Computed adaptive timeout in ms */
  timeout: number;
  /** Timestamp of last update */
  updatedAt: number;
}

interface TimingStore {
  [actionKey: string]: TimingRecord;
}

const DATA_DIR = join(__dirname, '..', '.runtime');
const DATA_FILE = join(DATA_DIR, 'adaptive-wait.json');

/** How many recent samples to keep per action */
const MAX_SAMPLES = 30;

/** Percentile to target (p95 = be fast but safe) */
const TARGET_PERCENTILE = 0.95;

/** Minimum timeout floor in ms (never go below this) */
const MIN_TIMEOUT = 2_000;

/** Maximum timeout ceiling in ms (never go above this) */
const MAX_TIMEOUT = 30_000;

/** Default timeouts per category when no data exists */
const DEFAULTS: Record<string, number> = {
  // Page navigation
  'nav:page-load': 10_000,
  'nav:route-change': 8_000,

  // Select/dropdown interactions
  'select:open-dropdown': 5_000,
  'select:pick-option': 5_000,
  'select:fill-and-pick': 8_000,

  // Button clicks & form actions
  'action:click': 3_000,
  'action:button-response': 8_000,
  'action:form-submit': 10_000,

  // Data loading
  'data:api-response': 8_000,
  'data:badge-appear': 8_000,
  'data:list-render': 5_000,

  // POS-specific
  'pos:product-select': 8_000,
  'pos:cart-update': 3_000,
  'pos:payment-modal': 5_000,
  'pos:sale-complete': 15_000,

  // PO-specific
  'po:save-draft': 10_000,
  'po:approve': 10_000,
  'po:status-badge': 10_000,

  // Storefront
  'shop:product-grid': 10_000,
  'shop:add-to-cart': 3_000,
  'shop:checkout-step': 5_000,

  // Misc
  'wait:stabilize': 500,
  'wait:animation': 300,
  'timeout:notification': 5_000,
  'timeout:modal': 5_000,
};

let store: TimingStore = {};

function loadStore(): void {
  try {
    if (existsSync(DATA_FILE)) {
      store = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch {
    store = {};
  }
}

function saveStore(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch {
    // Silently ignore write failures — timing data is best-effort
  }
}

/**
 * Record a completed action duration and recompute the adaptive timeout.
 */
export function recordTiming(actionKey: string, durationMs: number): void {
  loadStore();

  if (!store[actionKey]) {
    store[actionKey] = {
      durations: [],
      timeout: DEFAULTS[actionKey] ?? 8_000,
      updatedAt: Date.now(),
    };
  }

  const record = store[actionKey];
  record.durations.push(durationMs);

  // Keep only the most recent samples
  if (record.durations.length > MAX_SAMPLES) {
    record.durations = record.durations.slice(-MAX_SAMPLES);
  }

  // Compute adaptive timeout at the target percentile
  const sorted = [...record.durations].sort((a, b) => a - b);
  const pIdx = Math.max(0, Math.ceil(sorted.length * TARGET_PERCENTILE) - 1);
  const pValue = sorted[pIdx];

  // Adaptive timeout = p95 + 30% headroom, clamped to [MIN, MAX]
  const computed = Math.round(pValue * 1.3);
  record.timeout = Math.max(MIN_TIMEOUT, Math.min(MAX_TIMEOUT, computed));
  record.updatedAt = Date.now();

  saveStore();
}

/**
 * Get the current adaptive timeout for an action category.
 * Returns the computed value if data exists, otherwise the default seed.
 */
export function getAdaptiveTimeout(actionKey: string): number {
  loadStore();
  return store[actionKey]?.timeout ?? DEFAULTS[actionKey] ?? 8_000;
}

/**
 * Reset timing data for a specific action or all actions.
 */
export function resetTimings(actionKey?: string): void {
  loadStore();
  if (actionKey) {
    delete store[actionKey];
  } else {
    store = {};
  }
  saveStore();
}

/**
 * Get a summary of all tracked timings for debugging.
 */
export function getTimingSummary(): Record<
  string,
  { timeout: number; samples: number; lastDuration: number | null; avgDuration: number | null }
> {
  loadStore();
  const summary: Record<string, any> = {};
  for (const [key, record] of Object.entries(store)) {
    const avg =
      record.durations.length > 0
        ? Math.round(record.durations.reduce((a, b) => a + b, 0) / record.durations.length)
        : null;
    summary[key] = {
      timeout: record.timeout,
      samples: record.durations.length,
      lastDuration: record.durations[record.durations.length - 1] ?? null,
      avgDuration: avg,
    };
  }
  return summary;
}

/**
 * Helper: wrap a Playwright expect assertion with timing.
 *
 * Usage:
 *   await timedWait('pos:payment-modal', () =>
 *     expect(page.getByTestId('pos-payment-modal')).toBeVisible()
 *   );
 */
export async function timedWait(
  actionKey: string,
  assertion: () => Promise<void>,
  overrideTimeout?: number,
): Promise<void> {
  const start = Date.now();
  const timeout = overrideTimeout ?? getAdaptiveTimeout(actionKey);
  try {
    await assertion();
  } finally {
    const elapsed = Date.now() - start;
    recordTiming(actionKey, elapsed);
  }
}

/**
 * Common wait profiles — reusable timeout values derived from the
 * adaptive system. Import these in tests instead of hardcoding timeouts.
 */
export const waits = {
  /** Timeout for an element to become visible */
  get visible() {
    return getAdaptiveTimeout('action:click');
  },
  /** Timeout for a page to fully load */
  get pageLoad() {
    return getAdaptiveTimeout('nav:page-load');
  },
  /** Timeout for an API-backed list to render */
  get listRender() {
    return getAdaptiveTimeout('data:list-render');
  },
  /** Timeout for a modal to appear */
  get modal() {
    return getAdaptiveTimeout('timeout:modal');
  },
  /** Timeout for a notification toast */
  get notification() {
    return getAdaptiveTimeout('timeout:notification');
  },
  /** Short stabilization delay (not a timeout, a literal sleep) */
  get stabilize() {
    return getAdaptiveTimeout('wait:stabilize');
  },
  /** Animation completion delay */
  get animation() {
    return getAdaptiveTimeout('wait:animation');
  },
  /** POS-specific timeouts */
  pos: {
    get productSelect() { return getAdaptiveTimeout('pos:product-select'); },
    get cartUpdate() { return getAdaptiveTimeout('pos:cart-update'); },
    get paymentModal() { return getAdaptiveTimeout('pos:payment-modal'); },
    get saleComplete() { return getAdaptiveTimeout('pos:sale-complete'); },
  },
  /** PO-specific timeouts */
  po: {
    get saveDraft() { return getAdaptiveTimeout('po:save-draft'); },
    get approve() { return getAdaptiveTimeout('po:approve'); },
    get statusBadge() { return getAdaptiveTimeout('po:status-badge'); },
  },
  /** Storefront timeouts */
  shop: {
    get productGrid() { return getAdaptiveTimeout('shop:product-grid'); },
    get addToCart() { return getAdaptiveTimeout('shop:add-to-cart'); },
    get checkoutStep() { return getAdaptiveTimeout('shop:checkout-step'); },
  },
};
