'use client'

import { useState } from 'react'
import { fmtMoney } from '@/lib/format'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface Props {
  totalIncome: number
  totalExpenses: number
  userCurrency?: string
  onManageIncome?: () => void
}

export function BalanceSummary({ totalIncome, totalExpenses, userCurrency = 'USD', onManageIncome }: Props) {
  const isMobile = useIsMobile()
  const remaining = totalIncome - totalExpenses
  const isNegative = remaining < 0
  const [valueModal, setValueModal] = useState<{ title: string; value: string } | null>(null)

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Income — click the card to manage income sources */}
        <button
          type="button"
          onClick={onManageIncome}
          aria-label="Manage income sources"
          className="min-w-0 w-full bg-[#166534] dark:bg-green-950 border border-[#14532d] dark:border-green-800 rounded-lg p-3 sm:p-4 text-center transition-colors hover:bg-[#14532d] dark:hover:bg-green-900"
        >
          <p className="text-[10px] sm:text-xs font-semibold text-[#86efac] dark:text-green-400 uppercase tracking-wide mb-1 truncate">
            Total Income
          </p>
          <p className="text-sm sm:text-2xl font-bold text-white dark:text-green-300 truncate">{fmtMoney(totalIncome, userCurrency)}</p>
        </button>

        {/* Expenses — dark red in light mode */}
        <button
          type="button"
          onClick={isMobile ? () => setValueModal({ title: 'Total Expenses', value: fmtMoney(totalExpenses, userCurrency) }) : undefined}
          className="min-w-0 w-full text-left bg-[#991b1b] dark:bg-red-950 border border-[#7f1d1d] dark:border-red-900 rounded-lg p-3 sm:p-4 text-center sm:cursor-default"
        >
          <p className="text-[10px] sm:text-xs font-semibold text-[#fca5a5] dark:text-red-400 uppercase tracking-wide mb-1 truncate">
            Total Expenses
          </p>
          <p className="text-sm sm:text-2xl font-bold text-white dark:text-red-400 truncate">{fmtMoney(totalExpenses, userCurrency)}</p>
        </button>

        {/* Remaining — dynamic color */}
        <button
          type="button"
          onClick={isMobile ? () => setValueModal({ title: 'Remaining', value: `${isNegative ? '-' : ''}${fmtMoney(Math.abs(remaining), userCurrency)}` }) : undefined}
          className={`min-w-0 w-full text-left border rounded-lg p-3 sm:p-4 text-center sm:cursor-default ${
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
        </button>
      </div>

      {/* Mobile: full untruncated value */}
      <Dialog open={!!valueModal} onOpenChange={(isOpen) => { if (!isOpen) setValueModal(null) }}>
        <DialogContent className="w-[min(90vw,20rem)] text-center">
          <DialogTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {valueModal?.title}
          </DialogTitle>
          <p className="text-3xl font-bold break-words">{valueModal?.value}</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
