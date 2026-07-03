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
      <div className="flex rounded-lg border border-green-200 dark:border-[#166534] overflow-hidden">
        {GRANULARITIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setGranularity(key)}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              granularity === key
                ? 'bg-green-600 text-white'
                : 'bg-transparent text-green-700 dark:text-[#86efac] hover:bg-green-50 dark:hover:bg-[#1a2e1a]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous period" onClick={prev} className="p-1 rounded text-green-700 dark:text-[#86efac] hover:bg-green-50 dark:hover:bg-[#1a2e1a]">
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-32 text-center text-sm font-semibold text-green-900 dark:text-[#d1fae5]">
          {formatPeriodLabel(date, granularity)}
        </span>
        <button type="button" aria-label="Next period" onClick={next} className="p-1 rounded text-green-700 dark:text-[#86efac] hover:bg-green-50 dark:hover:bg-[#1a2e1a]">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
