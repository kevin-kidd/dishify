import { atomWithMMKV } from "app/provider/kv";

/**
 * Creates an atom with persistent storage that works on both web and native platforms.
 * Uses localStorage on web and MMKV on native.
 */
export const atomWithStorage = <T>(key: string, initialValue: T) => {
  return atomWithMMKV<T>(key, initialValue);
};
