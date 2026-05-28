'use client'

import { useQuery } from '@tanstack/react-query'

const KEY = ['exchange-rates'] as const

export function useExchangeRates() {
  return useQuery({
    queryKey: KEY,
    staleTime: 60 * 60 * 1000, // 1 hour
    queryFn: async () => {
      const res = await fetch('/api/exchange-rates')
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { rates: Record<string, number> }
      return data.rates
    },
  })
}
