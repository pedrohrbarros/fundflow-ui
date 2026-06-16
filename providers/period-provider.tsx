'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type Granularity, addPeriod, currentPeriodDate } from '@/lib/period'

interface PeriodContextValue {
  granularity: Granularity
  date: string
  setGranularity: (g: Granularity) => void
  setDate: (d: string) => void
  next: () => void
  prev: () => void
}

const PeriodContext = createContext<PeriodContextValue | null>(null)

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [granularity, setGranularity] = useState<Granularity>('monthly')
  const [date, setDate] = useState<string>(currentPeriodDate())

  const next = useCallback(() => setDate((d) => addPeriod(d, granularity, 1)), [granularity])
  const prev = useCallback(() => setDate((d) => addPeriod(d, granularity, -1)), [granularity])

  return (
    <PeriodContext.Provider value={{ granularity, date, setGranularity, setDate, next, prev }}>
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  const ctx = useContext(PeriodContext)
  if (!ctx) throw new Error('usePeriod must be used within PeriodProvider')
  return ctx
}
