'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CategoriesResponse,
  Category,
  CreateCategoryBody,
  UpdateCategoryBody,
} from '@/types'

const KEY = ['categories'] as const

export function useCategories() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<CategoriesResponse>
    },
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async (body: CreateCategoryBody) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Category>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async ({ id, ...body }: UpdateCategoryBody & { id: string }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Category>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Category>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
