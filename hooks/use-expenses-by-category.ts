'use client'

import { useQuery } from '@tanstack/react-query'
import type { ExpensesByCategoryResponse } from '@/types'

export function useExpensesByCategory() {
  return useQuery({
    queryKey: ['expenses', 'by-category'],
    meta: { showErrorToast: true },
    queryFn: async () => {
      const res = await fetch('/api/expenses/by-category')
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<ExpensesByCategoryResponse>
    },
  })
}
