import { atomWithStorage as atomWithWebStorage } from "jotai/utils";

/**
 * Creates an atom with persistent storage that works on both web and native platforms.
 * Uses localStorage on web and MMKV on native.
 */
export const atomWithStorage = <T>(key: string, initialValue: T) => {
  return atomWithWebStorage<T>(key, initialValue);
};
