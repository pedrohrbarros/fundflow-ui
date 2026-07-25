'use client'

import { useState } from 'react'
import { useExpenses } from '@/hooks/use-expenses'
import { useSourcesOfIncome } from '@/hooks/use-sources-of-income'
import { useCurrentUser } from '@/hooks/use-user'
import { useExchangeRates } from '@/hooks/use-exchange-rates'
import { BalanceSummary } from '@/components/dashboard/BalanceSummary'
import { ExpensesSection } from '@/components/dashboard/ExpensesSection'
import { IncomeModal } from '@/components/dashboard/IncomeModal'
import { getCountryCurrency } from '@/lib/countries'
import { convertCurrency } from '@/lib/currency'

export function DashboardClient() {
  const { data: expensesData } = useExpenses()
  const { data: incomeData } = useSourcesOfIncome()
  const { data: user } = useCurrentUser()
  const { data: rates, isLoading: isRatesLoading } = useExchangeRates()
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)

  const userCurrency = getCountryCurrency(user?.country ?? 'BR')

  const totalExpenses =
    expensesData?.total ??
    (expensesData?.expenses ?? []).reduce((sum, e) => sum + e.period_amount, 0)

  const sources = (incomeData?.sources_of_income ?? []).flatMap((g) => g.sources)
  let hasConversionError = false
  const totalIncome = !rates
    ? null
    : sources.reduce((sum, s) => {
        const converted = convertCurrency(s.period_amount, s.currency ?? 'USD', userCurrency, rates)
        if (converted === null) {
          hasConversionError = true
          return sum
        }
        return sum + converted
      }, 0)
  const showBalanceSummary = totalIncome !== null && !hasConversionError

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-background flex flex-col">
      <div className="w-full px-4 md:px-6 py-3 flex flex-col gap-3 flex-1 min-h-0">
        {showBalanceSummary ? (
          <BalanceSummary
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            userCurrency={userCurrency}
            onManageIncome={() => setIsIncomeModalOpen(true)}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {isRatesLoading
              ? 'Loading balance summary…'
              : 'Balance summary unavailable while exchange rates are incomplete.'}
          </div>
        )}
        <ExpensesSection />
      </div>
      <IncomeModal
        open={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
      />
    </div>
  )
}
