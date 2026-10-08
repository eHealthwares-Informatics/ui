import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PRINT_SERVER_DEFAULT,
  buildTestReceipt,
  discoverPrintServers,
  getPrintServerUrl,
  normalizeBaseUrl,
  parseCandidates,
  probeAgent,
  setPrintServerUrl,
  toWsUrl,
} from './printServer';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('normalizeBaseUrl', () => {
  it('adds http and the default port to a bare host', () => {
    expect(normalizeBaseUrl('localhost')).toBe('http://localhost:8094');
  });

  it('keeps an explicit scheme and port', () => {
    expect(normalizeBaseUrl('http://192.168.1.5:9000')).toBe('http://192.168.1.5:9000');
  });

  it('defaults an empty value', () => {
    expect(normalizeBaseUrl('')).toBe(PRINT_SERVER_DEFAULT);
  });
});

describe('parseCandidates', () => {
  it('expands an IP range and adds the port', () => {
    expect(parseCandidates('192.168.1.10-12')).toEqual([
      'http://192.168.1.10:8094',
      'http://192.168.1.11:8094',
      'http://192.168.1.12:8094',
    ]);
  });

  it('accepts a mix of hosts and dedupes', () => {
    expect(parseCandidates('localhost, localhost, 10.0.0.2')).toEqual([
      'http://localhost:8094',
      'http://10.0.0.2:8094',
    ]);
  });
});

describe('toWsUrl', () => {
  it('converts http to the ws endpoint', () => {
    expect(toWsUrl('http://localhost:8094')).toBe('ws://localhost:8094/ws');
  });
});

describe('print server url storage', () => {
  it('saves and reads a normalized url', () => {
    setPrintServerUrl('192.168.1.50');
    expect(getPrintServerUrl()).toBe('http://192.168.1.50:8094');
  });

  it('falls back to the default when unset', () => {
    expect(getPrintServerUrl()).toBe(PRINT_SERVER_DEFAULT);
  });
});

describe('discovery', () => {
  it('returns null when the host is not an agent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ service: 'other' }) })
    );
    expect(await probeAgent('http://localhost:8094')).toBeNull();
  });

  it('collects only responding agents', async () => {
    const agentInfo = { service: 'print-agent', hostname: 'counter', port: '8094' };
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          url.includes('192.168.1.10')
            ? { ok: true, json: async () => agentInfo }
            : { ok: false, json: async () => ({}) }
        )
      )
    );

    const found = await discoverPrintServers([
      'http://192.168.1.10:8094',
      'http://192.168.1.11:8094',
    ]);
    expect(found).toHaveLength(1);
    expect(found[0].url).toBe('http://192.168.1.10:8094');
  });
});

describe('buildTestReceipt', () => {
  it('produces a valid balanced receipt', () => {
    const receipt = buildTestReceipt();
    expect(receipt.items.length).toBeGreaterThan(0);
    expect(receipt.total).toBe(receipt.subtotal - receipt.discount + receipt.vat);
  });
});
