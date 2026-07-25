import { SpendingByCategoryChart } from '@/components/dashboard/SpendingByCategoryChart'

export default function DashboardPage() {
  return (
    <div className="h-full overflow-auto bg-background px-4 md:px-6 py-4">
      <h1 className="text-2xl font-semibold text-foreground mb-3">Dashboard</h1>
      <SpendingByCategoryChart />
    </div>
  )
}
