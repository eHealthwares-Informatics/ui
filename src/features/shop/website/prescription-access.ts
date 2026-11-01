/**
 * Anonymous prescriptions are reachable with the one-time access token issued
 * at upload. Tokens are kept per prescription id in localStorage so the phone /
 * browser that uploaded can reopen and order the prescription until it is
 * claimed by a signed-in account.
 */
const STORAGE_KEY = 'rx_prescription_access';

type TokenMap = Record<string, string>;

function read(): TokenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenMap) : {};
  } catch {
    return {};
  }
}

function write(map: TokenMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — anonymous reopen just won't work */
  }
}

export function savePrescriptionAccess(id: string, token: string): void {
  if (!id || !token) return;
  write({ ...read(), [id]: token });
}

export function getPrescriptionAccess(id: string): string | null {
  return read()[id] ?? null;
}

export function forgetPrescriptionAccess(id: string): void {
  const map = read();
  delete map[id];
  write(map);
}
