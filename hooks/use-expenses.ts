'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CreateExpenseBody,
  Expense,
  ExpensesResponse,
  UpdateExpenseBody,
} from '@/types'
import { usePeriod } from '@/providers/period-provider'
import { buildFilterQuery, type ExpenseFilter } from '@/lib/expense-filters'
import { handleFetchResponse } from '@/lib/client-api'

const KEY = ['expenses'] as const

export interface ExpenseSort {
  field: string
  direction: 'asc' | 'desc'
}

export function useExpenses(opts?: { page?: number; limit?: number; filters?: ExpenseFilter[]; sort?: ExpenseSort | null }) {
  const { granularity, date } = usePeriod()
  const filterQuery = buildFilterQuery(opts?.filters ?? [])
  const sort = opts?.sort ?? null
  return useQuery({
    queryKey: [...KEY, { granularity, date, page: opts?.page, limit: opts?.limit, filters: filterQuery, sort }],
    meta: { showErrorToast: true },
    queryFn: async () => {
      const qs = new URLSearchParams({ granularity, date })
      if (opts?.page) qs.set('page', String(opts.page))
      if (opts?.limit) qs.set('limit', String(opts.limit))
      if (filterQuery) qs.set('filters', JSON.stringify(filterQuery))
      if (sort) qs.set('sort', JSON.stringify(sort))
      const res = await fetch(`/api/expenses?${qs}`)
      handleFetchResponse(res)
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<ExpensesResponse>
    },
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async (body: CreateExpenseBody) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      handleFetchResponse(res)
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Expense>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async ({ id, ...body }: UpdateExpenseBody & { id: string }) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      handleFetchResponse(res)
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Expense>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      handleFetchResponse(res)
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Expense>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
