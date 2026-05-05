'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CreateExpenseBody,
  Expense,
  ExpensesResponse,
  UpdateExpenseBody,
} from '@/types'

const KEY = ['expenses'] as const

export function useExpenses(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (params?.page) qs.set('page', String(params.page))
      if (params?.limit) qs.set('limit', String(params.limit))
      const res = await fetch(`/api/expenses${qs.size ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<ExpensesResponse>
    },
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateExpenseBody) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Expense>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateExpenseBody & { id: string }) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Expense>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Expense>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
