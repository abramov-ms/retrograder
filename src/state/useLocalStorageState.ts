import { useEffect, useState } from 'react'

// `override`, when given, wins over both the stored and the default value
// (used to apply state arriving in a share link); the persistence effect
// then writes it to localStorage like any other value.
export function useLocalStorageState<T>(key: string, defaultValue: T, override?: T) {
  const [value, setValue] = useState<T>(() => {
    if (override !== undefined) return override
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}
