import { atomWithStorage, createJSONStorage } from "jotai/utils"
import { MMKV } from "react-native-mmkv"

const storage = new MMKV()

function getItem<T>(key: string): T | string | null {
  const value = storage.getString(key)
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch (error) {
    // If JSON.parse fails, return the original value
    return value
  }
}

function setItem<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value))
}

function removeItem(key: string): void {
  storage.delete(key)
}

function clearAll(): void {
  storage.clearAll()
}

export const atomWithMMKV = <T>(key: string, initialValue: T) =>
  atomWithStorage<T>(
    key,
    initialValue,
    createJSONStorage<T>(() => ({
      getItem,
      setItem,
      removeItem,
      clearAll,
    }))
  )
