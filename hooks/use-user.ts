'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { signOut } from 'next-auth/react'
import type { User, UpdateUserCountryBody } from '@/types'

const KEY = ['user'] as const

export function useCurrentUser() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch('/api/users/me')
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<User>
    },
  })
}

export function useUpdateUserCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: KEY,
    mutationFn: async (body: UpdateUserCountryBody) => {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<User>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/users/me', { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
    },
    onSuccess: () => signOut({ redirectTo: '/' }),
  })
}
