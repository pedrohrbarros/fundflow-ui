import { SpendingByCategoryChart } from '@/components/dashboard/SpendingByCategoryChart'

export default function DashboardPage() {
  return (
    <div className="h-full overflow-auto bg-green-50 dark:bg-gray-950 px-4 md:px-6 py-4">
      <h1 className="text-2xl font-semibold text-green-900 dark:text-[#d1fae5] mb-3">Dashboard</h1>
      <SpendingByCategoryChart />
    </div>
  )
}
