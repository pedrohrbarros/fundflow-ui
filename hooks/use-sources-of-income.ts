'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CreateSourceOfIncomeBody,
  SourceOfIncome,
  SourcesOfIncomeResponse,
  UpdateSourceOfIncomeBody,
} from '@/types'

const KEY = ['sources-of-income'] as const

export function useSourcesOfIncome() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch('/api/sources-of-income')
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<SourcesOfIncomeResponse>
    },
  })
}

export function useCreateSourceOfIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async (body: CreateSourceOfIncomeBody) => {
      const res = await fetch('/api/sources-of-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<SourceOfIncome>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateSourceOfIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async ({ id, ...body }: UpdateSourceOfIncomeBody & { id: string }) => {
      const res = await fetch(`/api/sources-of-income/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<SourceOfIncome>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteSourceOfIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sources-of-income/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<SourceOfIncome>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
