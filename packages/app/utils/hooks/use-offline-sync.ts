import { useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
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
  atomToSync: any, // pass your Jotai atom instance here
  syncFn: (toSync: TSyncInput) => void,
  options?: {
    versionCheck?: boolean;
    onError?: (error: Error) => void;
    getSyncPayload?: (data: TData) => TSyncInput;
    customOnlinePredicate?: () => boolean; // override isOnline check
  },
) {
  // For a real app, you'd ensure user is authenticated or handle gracefully
  const { useSession } = authClient;
  const session = useSession();
  const isUserLoggedIn = !!session?.data?.user?.id;

  const isOnline = useOnline();
  const [localData] = useAtom<TData>(atomToSync);

  const debouncedSyncRef = useRef(
    debounce((data: TData) => {
      try {
        if (!isUserLoggedIn) {
          // We might queue or just skip if not logged in.
          throw new Error("User not authenticated. Cannot sync.");
        }
        if (options?.getSyncPayload) {
          const payload = options?.getSyncPayload(data);
          syncFn(payload);
        } else {
          // If no transform needed, cast as unknown
          syncFn(data as unknown as TSyncInput);
        }
      } catch (err: unknown) {
        if (options?.onError && err instanceof Error) {
          options.onError(err);
        }
      }
    }, 1000),
  );

  // Handle initial version checks or migrations
  useEffect(() => {
    if (options?.versionCheck) {
      ensureLocalDataVersion();
    }
  }, [options?.versionCheck]);

  /**
   * On each localData or online status change,
   * attempt to push local changes to the server.
   * We debounce calls to avoid updates on every keystroke, etc.
   */
  useEffect(() => {
    const canSync = options?.customOnlinePredicate ? options?.customOnlinePredicate() : isOnline;
    if (!canSync) return;

    // Debianched push to server:
    debouncedSyncRef.current(localData);
  }, [localData, isOnline, options?.customOnlinePredicate]);

  /**
   * Provide a manual sync method if needed.
   */
  const forceSync = useCallback(() => {
    try {
      debouncedSyncRef.current(localData);
    } catch (err) {
      const castErr = err as TRPCClientError<any>;
      toast.error(castErr.message ?? "Failed to sync");
    }
  }, [localData]);

  return {
    data: localData,
    isOnline,
    isUserLoggedIn,
    forceSync,
  };
}
