'use client'

import { useExpenses } from '@/hooks/use-expenses'
import { useSourcesOfIncome } from '@/hooks/use-sources-of-income'
import { BalanceSummary } from '@/components/dashboard/BalanceSummary'
import { CategoriesSection } from '@/components/dashboard/CategoriesSection'
import { IncomeSection } from '@/components/dashboard/IncomeSection'
import { ExpensesSection } from '@/components/dashboard/ExpensesSection'

export function DashboardClient() {
  const { data: expensesData } = useExpenses({ limit: 100 })
  const { data: incomeData } = useSourcesOfIncome()

  const totalIncome = (incomeData?.sources_of_income ?? []).reduce(
    (sum, s) => sum + s.income,
    0
  )
  const totalExpenses = (expensesData?.expenses ?? []).reduce(
    (sum, e) => sum + e.amount,
    0
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-green-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-green-900 dark:text-green-400">Monthly Budget</h1>
          <p className="text-green-600 dark:text-green-500 text-sm mt-1">
            {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <BalanceSummary totalIncome={totalIncome} totalExpenses={totalExpenses} />
        <CategoriesSection />
        <IncomeSection />
        <ExpensesSection />
      </div>
    </div>
  )
}
