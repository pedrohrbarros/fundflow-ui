'use client'

import { useExpenses } from '@/hooks/use-expenses'
import { BalanceSummary } from '@/components/dashboard/BalanceSummary'
import { ExpensesSection } from '@/components/dashboard/ExpensesSection'

export function DashboardClient() {
  const { data: expensesData } = useExpenses()

  const totalExpenses = (expensesData?.expenses ?? []).reduce(
    (sum, e) => sum + e.amount,
    0
  )

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-green-50 dark:bg-gray-950">
      <div className="w-full px-[10vw] py-8">
        <BalanceSummary totalIncome={0} totalExpenses={totalExpenses} />
        <ExpensesSection />
      </div>
    </div>
  )
}
