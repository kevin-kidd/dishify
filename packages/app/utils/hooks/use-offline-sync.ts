import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOnline } from "./use-online";
import { toast } from "../toast";
import { authClient } from "../auth/client"; // or client.native if you need
import type { TRPCClientError } from "@trpc/client";

/**
 * A version key for local data. Bump this when you change schema + run migrations.
 */
const LOCAL_STORAGE_VERSION_KEY = "OFFLINE_SYNC_VERSION";

/**
 * You can keep this in sync with your server or just bump manually
 * whenever you make a breaking schema change.
 */
const CURRENT_LOCAL_DATA_VERSION = 1;

/**
 * Basic debounce utility to limit how often we push changes to the server.
 * Adjust the delay to suit your needs.
 */
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generic function to check or migrate local data version.
 * Could be expanded for more robust migrations.
 */
function ensureLocalDataVersion() {
  const storedVersion = Number(localStorage.getItem(LOCAL_STORAGE_VERSION_KEY) ?? "0");
  if (storedVersion !== CURRENT_LOCAL_DATA_VERSION) {
    // If mismatch, you can attempt migrations here. For now, we'll
    // just clear and set the correct version.
    localStorage.clear();
    localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, String(CURRENT_LOCAL_DATA_VERSION));
  }
}

/**
 * NOTE:
 * - TData: shape of the local data (e.g., dictionary of favorites).
 * - TSyncInput: shape of the data you send to the server to sync.
 *
 * @param atomToSync - Jotai atom containing your local data.
 * @param syncFn - The function that pushes local changes to the server
 * @param options - Additional settings (e.g., error or success handlers).
 *
 * Use:
 *   const { syncAll, data } = useOfflineSync(yourAtom, mutation.mutate);
 */
export function useOfflineSync<TData, TSyncInput>(
  atomToSync: any,
  syncFn: (toSync: TSyncInput) => Promise<void>,
  options?: {
    versionCheck?: boolean;
    onError?: (error: Error) => void;
    getSyncPayload?: (data: TData) => TSyncInput | null;
    customOnlinePredicate?: () => boolean;
  },
) {
  const { useSession } = authClient;
  const session = useSession();
  const isUserLoggedIn = !!session?.data?.user?.id;
  const isOnline = useOnline();
  const [localData] = useAtom<TData>(atomToSync);

  // Store pending changes in localStorage to persist across page loads
  const STORAGE_KEY = `offline_sync_${atomToSync.toString()}`;

  // Initialize pending changes from localStorage
  const [pendingChanges, setPendingChanges] = useState<TSyncInput[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Update localStorage when pendingChanges changes
  useEffect(() => {
    if (pendingChanges.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingChanges));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [pendingChanges, STORAGE_KEY]);

  // Function to add a change to the queue
  const queueChange = useCallback((change: TSyncInput) => {
    setPendingChanges((prev) => [...prev, change]);
  }, []);

  // Function to remove a change from the queue
  const removeChange = useCallback((change: TSyncInput) => {
    setPendingChanges((prev) =>
      prev.filter((item) => JSON.stringify(item) !== JSON.stringify(change)),
    );
  }, []);

  // Process the sync queue
  const processSyncQueue = useCallback(async () => {
    if (!isUserLoggedIn || !isOnline || pendingChanges.length === 0) return;

    for (const change of pendingChanges) {
      try {
        await syncFn(change);
        removeChange(change);
      } catch (err) {
        if (options?.onError && err instanceof Error) {
          options.onError(err);
        }
        // Stop processing on first error
        break;
      }
    }
  }, [isUserLoggedIn, isOnline, pendingChanges, syncFn, removeChange, options?.onError]);

  // Process queue when online status changes
  useEffect(() => {
    if (isOnline) {
      processSyncQueue();
    }
  }, [isOnline, processSyncQueue]);

  // Process queue when data changes (but debounced)
  const debouncedSync = useRef(
    debounce(() => {
      if (!options?.getSyncPayload) return;

      const payload = options.getSyncPayload(localData);
      if (payload) {
        queueChange(payload);
        if (isOnline) {
          processSyncQueue();
        }
      }
    }, 1000),
  ).current;

  // Run debounced sync when options.getSyncPayload changes
  useEffect(() => {
    debouncedSync();
  }, [debouncedSync]); // localData is already captured in the debounced function closure

  // Handle initial version checks
  useEffect(() => {
    if (options?.versionCheck) {
      ensureLocalDataVersion();
    }
  }, [options?.versionCheck]);

  return {
    data: localData,
    isOnline,
    isUserLoggedIn,
    pendingChanges,
    queueChange,
    processSyncQueue,
  };
}
