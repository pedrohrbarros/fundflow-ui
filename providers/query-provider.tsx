'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

type QueryMeta = {
  showErrorToast?: boolean
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: QueryMeta
  }
}

function shouldShowQueryErrorToast(query: { meta?: QueryMeta }): boolean {
  return query.meta?.showErrorToast === true
}

function toServiceName(key: readonly unknown[] | undefined): string {
  const raw = key?.[0]
  if (typeof raw !== 'string') return 'data'
  return raw
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
        queryCache: new QueryCache({
          onError: (_error, query) => {
            if (!shouldShowQueryErrorToast(query)) return
            toast.error(`Failed to fetch ${toServiceName(query.queryKey)}`)
          },
        }),
        mutationCache: new MutationCache({
          onError: (_error, _variables, _context, mutation) =>
            toast.error(`Failed to fetch ${toServiceName(mutation.options.mutationKey)}`),
        }),
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
