'use client'

import { useQuery } from '@tanstack/react-query'
import type { ExpensesByCategoryResponse } from '@/types'
import { usePeriod } from '@/providers/period-provider'

export function useExpensesByCategory() {
  const { granularity, date } = usePeriod()
  return useQuery({
    queryKey: ['expenses', 'by-category', { granularity, date }],
    meta: { showErrorToast: true },
    queryFn: async () => {
      const qs = new URLSearchParams({ granularity, date })
      const res = await fetch(`/api/expenses/by-category?${qs}`)
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<ExpensesByCategoryResponse>
    },
  })
}
