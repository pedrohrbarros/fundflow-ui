'use client'

import { useState } from 'react'
import { useExpenses } from '@/hooks/use-expenses'
import { useSourcesOfIncome } from '@/hooks/use-sources-of-income'
import { BalanceSummary } from '@/components/dashboard/BalanceSummary'
import { ExpensesSection } from '@/components/dashboard/ExpensesSection'
import { IncomeModal } from '@/components/dashboard/IncomeModal'

export function DashboardClient() {
  const { data: expensesData } = useExpenses()
  const { data: incomeData } = useSourcesOfIncome()
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)

  const totalExpenses = (expensesData?.expenses ?? []).reduce(
    (sum, e) => sum + e.amount,
    0
  )

  const totalIncome = Object.values(incomeData?.sources_of_income ?? {})
    .flat()
    .reduce((sum, s) => sum + s.income, 0)

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-green-50 dark:bg-gray-950">
      <div className="w-full px-[10vw] py-8">
        <BalanceSummary
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
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
