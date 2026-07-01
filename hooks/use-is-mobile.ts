'use client'

import { useSyncExternalStore } from 'react'

/**
 * SSR-safe media-query hook. Defaults to the Tailwind `sm` breakpoint,
 * so `true` means "smaller than sm" (i.e. mobile).
 */
export function useIsMobile(query = '(max-width: 639px)') {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  )
}
