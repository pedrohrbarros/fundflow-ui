'use client'

import { fmtMoney } from '@/lib/format'

interface Props {
  totalIncome: number
  totalExpenses: number
  userCurrency?: string
  onManageIncome?: () => void
}

export function BalanceSummary({ totalIncome, totalExpenses, userCurrency = 'USD', onManageIncome }: Props) {
  const remaining = totalIncome - totalExpenses
  const isNegative = remaining < 0

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {/* Income — dark green in light mode */}
      <div className="relative min-w-0 bg-[#166534] dark:bg-green-950 border border-[#14532d] dark:border-green-800 rounded-lg p-3 sm:p-4 text-center">
        {onManageIncome ? (
          <button
            type="button"
            onClick={onManageIncome}
            aria-label="Manage income sources"
            className="absolute top-2 right-2 p-1 text-[#86efac] dark:text-green-400 opacity-60 hover:opacity-100 hover:bg-[#14532d] dark:hover:bg-green-900 rounded transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        ) : null}
        <p className="text-[10px] sm:text-xs font-semibold text-[#86efac] dark:text-green-400 uppercase tracking-wide mb-1 truncate">
          Total Income
        </p>
        <p className="text-sm sm:text-2xl font-bold text-white dark:text-green-300 truncate">{fmtMoney(totalIncome, userCurrency)}</p>
      </div>

      {/* Expenses — dark red in light mode */}
      <div className="min-w-0 bg-[#991b1b] dark:bg-red-950 border border-[#7f1d1d] dark:border-red-900 rounded-lg p-3 sm:p-4 text-center">
        <p className="text-[10px] sm:text-xs font-semibold text-[#fca5a5] dark:text-red-400 uppercase tracking-wide mb-1 truncate">
          Total Expenses
        </p>
        <p className="text-sm sm:text-2xl font-bold text-white dark:text-red-400 truncate">{fmtMoney(totalExpenses, userCurrency)}</p>
      </div>

      {/* Remaining — dynamic color */}
      <div
        className={`min-w-0 border rounded-lg p-3 sm:p-4 text-center ${
          isNegative
            ? 'bg-[#991b1b] dark:bg-red-950 border-[#7f1d1d] dark:border-red-900'
            : 'bg-[#166534] dark:bg-green-950 border-[#14532d] dark:border-green-800'
        }`}
      >
        <p
          className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1 truncate ${
            isNegative
              ? 'text-[#fca5a5] dark:text-red-400'
              : 'text-[#86efac] dark:text-green-400'
          }`}
        >
          Remaining
        </p>
        <p
          data-testid="remaining-amount"
          className="text-sm sm:text-2xl font-bold text-white dark:text-green-400 truncate"
        >
          {isNegative ? '-' : ''}
          {fmtMoney(Math.abs(remaining), userCurrency)}
        </p>
      </div>
    </div>
  )
}
