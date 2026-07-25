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
          className="min-w-0 w-full bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 text-center shadow-sm transition-colors hover:bg-primary/10 motion-reduce:transition-none"
        >
          <p className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wide mb-1 truncate">
            Total Income
          </p>
          <p className="text-sm sm:text-2xl font-bold text-primary tabular-nums truncate">{fmtMoney(totalIncome, userCurrency)}</p>
        </button>

        {/* Expenses — dark red in light mode */}
        <button
          type="button"
          onClick={isMobile ? () => setValueModal({ title: 'Total Expenses', value: fmtMoney(totalExpenses, userCurrency) }) : undefined}
          className="min-w-0 w-full bg-destructive/5 border border-destructive/20 rounded-lg p-3 sm:p-4 text-center shadow-sm sm:cursor-default"
        >
          <p className="text-[10px] sm:text-xs font-semibold text-destructive uppercase tracking-wide mb-1 truncate">
            Total Expenses
          </p>
          <p className="text-sm sm:text-2xl font-bold text-destructive tabular-nums truncate">{fmtMoney(totalExpenses, userCurrency)}</p>
        </button>

        {/* Remaining — dynamic color */}
        <button
          type="button"
          onClick={isMobile ? () => setValueModal({ title: 'Remaining', value: `${isNegative ? '-' : ''}${fmtMoney(Math.abs(remaining), userCurrency)}` }) : undefined}
          className={`min-w-0 w-full border rounded-lg p-3 sm:p-4 text-center shadow-sm sm:cursor-default ${
            isNegative
              ? 'bg-destructive/5 border-destructive/20'
              : 'bg-primary/5 border-primary/20'
          }`}
        >
          <p
            className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1 truncate ${
              isNegative
                ? 'text-destructive'
                : 'text-primary'
            }`}
          >
            Remaining
          </p>
          <p
            data-testid="remaining-amount"
            className={`text-sm sm:text-2xl font-bold tabular-nums truncate ${isNegative ? 'text-destructive' : 'text-primary'}`}
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
