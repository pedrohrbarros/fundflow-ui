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
  const { data: rates } = useExchangeRates()
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)

  const userCurrency = getCountryCurrency(user?.country ?? 'BR')

  const totalExpenses = (expensesData?.expenses ?? []).reduce(
    (sum, e) => sum + e.amount,
    0
  )

  const totalIncome = !rates
    ? 0
    : Object.values(incomeData?.sources_of_income ?? {})
        .flat()
        .reduce((sum, s) => {
          return sum + convertCurrency(s.income, s.currency ?? 'USD', userCurrency, rates)
        }, 0)

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-green-50 dark:bg-gray-950">
      <div className="w-full px-6 md:px-10 py-8">
        <BalanceSummary
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          userCurrency={userCurrency}
          onManageIncome={() => setIsIncomeModalOpen(true)}
        />
        <ExpensesSection />
      </div>
      <IncomeModal
        open={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
      />
    </div>
  )
}
