import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { createSale, salesKeys } from '../../api/posApi';
import { OfflineSaleRecord, usePosStore } from '../store/usePosStore';

export const OFFLINE_SYNC_INTERVAL_MS = 60_000;

/**
 * True only for transport-level failures (server unreachable / no response) —
 * never for business errors such as 4xx insufficient-stock responses.
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response;
  }
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

type SyncResult = 'synced' | 'failed' | 'offline';

interface OfflineSalesSync {
  pendingCount: number;
  failedCount: number;
  syncing: boolean;
  syncNow: () => Promise<void>;
  retryFailed: () => Promise<void>;
}

/**
 * Drives the offline complete-sale queue:
 * - auto-syncs `pending_sync` entries on the window `online` event and on a
 *   60s interval while any are pending;
 * - never auto-retries `failed` entries (cashier must resolve + retry);
 * - reuses the ORIGINAL `saleNumber` from the captured payload so the backend
 *   sees the same sale identity on every attempt (best-effort dedupe).
 */
export function useOfflineSalesSync(): OfflineSalesSync {
  const queryClient = useQueryClient();
  const offlineSaleQueue = usePosStore((s) => s.offlineSaleQueue);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const pendingCount = offlineSaleQueue.filter((e) => e.status === 'pending_sync').length;
  const failedCount = offlineSaleQueue.filter((e) => e.status === 'failed').length;

  const syncRecord = useCallback(
    async (record: OfflineSaleRecord): Promise<SyncResult> => {
      try {
        await createSale(record.payload as any);
        usePosStore.getState().markOfflineSaleSynced(record.id);
        queryClient.invalidateQueries(salesKeys.list);
        queryClient.invalidateQueries({ queryKey: ['rxsoft-sales-analytics'] });
        return 'synced';
      } catch (error) {
        if (isNetworkError(error)) {
          return 'offline';
        }
        const message = getApiErrorMessage(error);
        usePosStore.getState().markOfflineSaleFailed(record.id, message);
        notifications.show({
          color: 'red',
          title: `Offline sale ${record.saleCode} rejected`,
          message: `${message} — resolve manually, then use “Retry failed”.`,
          autoClose: false,
        });
        return 'failed';
      }
    },
    [queryClient]
  );

  const runSync = useCallback(async () => {
    if (syncingRef.current) {
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    syncingRef.current = true;
    setSyncing(true);
    try {
      let synced = 0;
      const pending = usePosStore
        .getState()
        .offlineSaleQueue.filter((e) => e.status === 'pending_sync');
      for (const record of pending) {
        const result = await syncRecord(record);
        if (result === 'synced') {
          synced += 1;
        }
        if (result === 'offline') {
          break;
        }
      }
      if (synced > 0) {
        notifications.show({
          color: 'teal',
          message: `Synced ${synced} offline sale${synced === 1 ? '' : 's'}.`,
        });
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [syncRecord]);

  const retryFailed = useCallback(async () => {
    const count = usePosStore.getState().retryFailedOfflineSales();
    if (count > 0) {
      await runSync();
    }
  }, [runSync]);

  useEffect(() => {
    function handleOnline() {
      void runSync();
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [runSync]);

  useEffect(() => {
    if (pendingCount === 0) {
      return;
    }
    const timer = setInterval(() => {
      void runSync();
    }, OFFLINE_SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pendingCount, runSync]);

  return { pendingCount, failedCount, syncing, syncNow: runSync, retryFailed };
}
