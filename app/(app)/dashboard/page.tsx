import { SpendingByCategoryChart } from '@/components/dashboard/SpendingByCategoryChart'

export default function DashboardPage() {
  return (
    <div className="h-full overflow-auto bg-green-50 dark:bg-gray-950 px-6 md:px-10 py-8">
      <h1 className="text-2xl font-semibold text-green-900 dark:text-[#d1fae5] mb-6">Dashboard</h1>
      <div className="max-w-2xl">
        <SpendingByCategoryChart />
      </div>
    </div>
  )
}
