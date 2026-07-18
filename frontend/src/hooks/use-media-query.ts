import { useCallback, useSyncExternalStore } from "react"

// Tailwind's default breakpoints
const breakpoints = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
} as const

type BreakpointKey = keyof typeof breakpoints

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") return () => {}

      const matchMedia = window.matchMedia(query)
      matchMedia.addEventListener("change", callback)

      return () => {
        matchMedia.removeEventListener("change", callback)
      }
    },
    [query]
  )

  const getSnapshot = () => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  }

  const getServerSnapshot = () => false

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useIsBreakpointOrHigher(breakpoint: BreakpointKey): boolean {
  const query = breakpoints[breakpoint]

  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") return () => {}

      const matchMedia = window.matchMedia(query)
      matchMedia.addEventListener("change", callback)

      return () => {
        matchMedia.removeEventListener("change", callback)
      }
    },
    [query]
  )

  const getSnapshot = () => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  }

  const getServerSnapshot = () => false

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
