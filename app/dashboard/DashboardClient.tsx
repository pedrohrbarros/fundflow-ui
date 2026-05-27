'use client'

import { useExpenses } from '@/hooks/use-expenses'
import { useSourcesOfIncome } from '@/hooks/use-sources-of-income'
import { BalanceSummary } from '@/components/dashboard/BalanceSummary'
import { CategoriesSection } from '@/components/dashboard/CategoriesSection'
import { IncomeSection } from '@/components/dashboard/IncomeSection'
import { ExpensesSection } from '@/components/dashboard/ExpensesSection'

export function DashboardClient() {
  const { data: expensesData } = useExpenses()
  const { data: incomeData } = useSourcesOfIncome()

  const totalIncome = incomeData
    ? Object.values(incomeData).flat().reduce((sum, s) => sum + s.income, 0)
    : 0
  const totalExpenses = (expensesData?.expenses ?? []).reduce(
    (sum, e) => sum + e.amount,
    0
  )

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-green-50 dark:bg-gray-950">
      <div className="w-full px-[10vw] py-8">
        <BalanceSummary totalIncome={totalIncome} totalExpenses={totalExpenses} />
        <CategoriesSection />
        <IncomeSection />
        <ExpensesSection />
      </div>
    </div>
  )
}
