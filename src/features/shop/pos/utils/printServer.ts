/**
 * Print-server (print-agent) client helpers for the web POS.
 *
 * The configured server URL is stored per-device in localStorage (mirroring the
 * Android app's SharedPreferences, since the counter PC address is a device
 * concern, not a user preference).
 *
 * Discovery mirrors the mobile app's `GET /discover` probe, but browsers cannot
 * scan a subnet, so the user supplies candidate IPs / ranges to probe.
 * Printing goes over the agent's websocket endpoint first and falls back to the
 * HTTP `POST /print/receipt` route.
 */

export const PRINT_SERVER_DEFAULT = 'http://localhost:8094';
export const PRINT_SERVER_PORT = 8094;

const STORAGE_KEY = 'rxsoft.pos.printServerUrl';

export interface AgentInfo {
  service: string;
  version: string;
  hostname: string;
  ips: string[];
  port: string;
  printer: string;
  width: number;
  platform: string;
  available?: boolean;
}

export interface DiscoveredAgent {
  url: string;
  info: AgentInfo;
}

/** Normalize a user-entered host/URL into an absolute `http(s)://host[:port]`. */
export function normalizeBaseUrl(url: string, port = PRINT_SERVER_PORT): string {
  let value = (url || '').trim();
  if (!value) return PRINT_SERVER_DEFAULT;
  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }
  try {
    const parsed = new URL(value);
    if (!parsed.port) {
      parsed.port = String(port);
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return PRINT_SERVER_DEFAULT;
  }
}

export function getPrintServerUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || PRINT_SERVER_DEFAULT;
  } catch {
    return PRINT_SERVER_DEFAULT;
  }
}

export function setPrintServerUrl(url: string, port = PRINT_SERVER_PORT): string {
  const normalized = normalizeBaseUrl(url, port);
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    /* localStorage unavailable (private mode) — keep in-memory only */
  }
  return normalized;
}

/** Convert an http(s) base URL to the agent's websocket endpoint. */
export function toWsUrl(base: string): string {
  const normalized = normalizeBaseUrl(base);
  return `${normalized.replace(/^http/i, 'ws')}/ws`;
}

/**
 * Expand user input into candidate base URLs. Accepts comma/space separated
 * hosts and `a.b.c.10-20` ranges, e.g. `192.168.1.10-12, localhost`.
 */
export function parseCandidates(input: string, port = PRINT_SERVER_PORT): string[] {
  const out: string[] = [];
  for (const token of input.split(/[\s,;]+/).filter(Boolean)) {
    const range = token.match(/^(\d+\.\d+\.\d+\.)(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const from = Number(range[2]);
      const to = Number(range[3]);
      for (let i = Math.min(from, to); i <= Math.max(from, to); i++) {
        out.push(`http://${range[1]}${i}:${port}`);
      }
      continue;
    }
    out.push(normalizeBaseUrl(token, port));
  }
  return [...new Set(out)];
}

/** Probe a single host's `GET /discover`; resolves to null when not an agent. */
export async function probeAgent(base: string, timeoutMs = 1500): Promise<AgentInfo | null> {
  const baseUrl = normalizeBaseUrl(base);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${baseUrl}/discover`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as AgentInfo;
    if (data?.service !== 'print-agent') return null;
    return data;
  } catch {
    return null;
  }
}

/** Probe every candidate concurrently, returning the agents that responded. */
export async function discoverPrintServers(candidates: string[]): Promise<DiscoveredAgent[]> {
  const results = await Promise.all(
    candidates.map(async (base) => {
      const info = await probeAgent(base);
      return info ? { url: normalizeBaseUrl(base), info } : null;
    })
  );
  return results.filter((r): r is DiscoveredAgent => r !== null);
}

export interface AgentReceiptPayload {
  saleNumber: string;
  customerName?: string;
  header?: string;
  footer?: string;
  currency?: string;
  items: Array<{ code?: string; name: string; qty: number; price: number; total: number }>;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
}

/**
 * Send a receipt over the agent websocket. Resolves true on `ack`, false on
 * error/timeout so callers can fall back to HTTP.
 */
export function printOverWebSocket(
  base: string,
  payload: AgentReceiptPayload,
  timeoutMs = 3000
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket?.close();
      } catch {
        /* already closed */
      }
      resolve(ok);
    };

    let socket: WebSocket | null = null;
    const timer = setTimeout(() => finish(false), timeoutMs);

    try {
      socket = new WebSocket(toWsUrl(base));
    } catch {
      finish(false);
      return;
    }

    socket.onopen = () => {
      try {
        socket?.send(JSON.stringify({ type: 'print', payload }));
      } catch {
        finish(false);
      }
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data));
        if (message.type === 'ack') finish(true);
        else if (message.type === 'error') finish(false);
      } catch {
        /* ignore malformed frames (e.g. the initial info) */
      }
    };
    socket.onerror = () => finish(false);
    socket.onclose = () => finish(false);
  });
}

/** Send a receipt over HTTP `POST /print/receipt`. */
export async function printOverHttp(
  base: string,
  payload: AgentReceiptPayload,
  timeoutMs = 3000
): Promise<boolean> {
  const baseUrl = normalizeBaseUrl(base);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${baseUrl}/print/receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/** Websocket first, then HTTP. Resolves true if either path succeeds. */
export async function sendReceipt(base: string, payload: AgentReceiptPayload): Promise<boolean> {
  if (await printOverWebSocket(base, payload)) return true;
  return printOverHttp(base, payload);
}

/** Build a sample receipt for the settings "Print test page" action. */
export function buildTestReceipt(): AgentReceiptPayload {
  return {
    saleNumber: `TEST-${Date.now() % 100000}`,
    header: 'PRINT TEST',
    footer: 'Thank you for your patronage!',
    items: [
      { name: 'Test Item A', qty: 2, price: 5.0, total: 10.0 },
      { name: 'Test Item B', qty: 1, price: 12.5, total: 12.5 },
    ],
    subtotal: 22.5,
    discount: 2.5,
    vat: 4.0,
    total: 24.0,
    paidAmount: 30.0,
    changeAmount: 6.0,
  };
}

export interface TestPrintResult {
  ok: boolean;
  message: string;
}

/** Send the test page to the currently configured server. */
export async function printTestPage(base = getPrintServerUrl()): Promise<TestPrintResult> {
  const baseUrl = normalizeBaseUrl(base);
  const info = await probeAgent(baseUrl);
  if (!info) {
    return { ok: false, message: `No print-agent responded at ${baseUrl}` };
  }
  const ok = await sendReceipt(baseUrl, buildTestReceipt());
  return ok
    ? { ok: true, message: `Test page sent to ${baseUrl}` }
    : { ok: false, message: `Agent at ${baseUrl} could not print the test page` };
}
