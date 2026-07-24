'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePeriod } from '@/providers/period-provider'
import { formatPeriodLabel, type Granularity } from '@/lib/period'

const GRANULARITIES: { key: Granularity; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'annually', label: 'Annually' },
]

export function PeriodSelector() {
  const { granularity, date, setGranularity, next, prev } = usePeriod()

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex rounded-lg border border-border overflow-hidden">
        {GRANULARITIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setGranularity(key)}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              granularity === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous period" onClick={prev} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-32 text-center text-sm font-semibold text-foreground">
          {formatPeriodLabel(date, granularity)}
        </span>
        <button type="button" aria-label="Next period" onClick={next} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
