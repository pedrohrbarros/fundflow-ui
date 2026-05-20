'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CreatePaymentMethodBody,
  PaymentMethod,
  PaymentMethodsResponse,
  UpdatePaymentMethodBody,
} from '@/types'

const KEY = ['payment-methods'] as const

export function usePaymentMethods() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch('/api/payment-methods')
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<PaymentMethodsResponse>
    },
  })
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async (body: CreatePaymentMethodBody) => {
      const res = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<PaymentMethod>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async ({ id, ...body }: UpdatePaymentMethodBody & { id: string }) => {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<PaymentMethod>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<PaymentMethod>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
