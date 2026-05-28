'use client'

interface Props {
  totalIncome: number
  totalExpenses: number
  onManageIncome: () => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Math.abs(n))
}

export function BalanceSummary({ totalIncome, totalExpenses, onManageIncome }: Props) {
  const remaining = totalIncome - totalExpenses
  const isNegative = remaining < 0

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <div className="relative bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
        <button
          onClick={onManageIncome}
          aria-label="Manage income sources"
          className="absolute top-2 right-2 p-1 text-green-600 dark:text-green-400 opacity-50 hover:opacity-100 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-opacity"
        >
          ✎
        </button>
        <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
          Total Income
        </p>
        <p className="text-2xl font-bold text-green-800 dark:text-green-300">{fmt(totalIncome)}</p>
      </div>

      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-4 text-center">
        <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">
          Total Expenses
        </p>
        <p className="text-2xl font-bold text-red-700 dark:text-red-400">{fmt(totalExpenses)}</p>
      </div>

      <div
        className={`border rounded-lg p-4 text-center ${
          isNegative
            ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900'
            : 'bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-800'
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
            isNegative ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
          }`}
        >
          Remaining
        </p>
        <p
          data-testid="remaining-amount"
          className={`text-2xl font-bold ${
            isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}
        >
          {isNegative ? '-' : ''}
          {fmt(remaining)}
        </p>
      </div>
    </div>
  )
}
