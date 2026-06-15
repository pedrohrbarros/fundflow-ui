'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useExpensesByCategory } from '@/hooks/use-expenses-by-category'
import { fmtMoney } from '@/lib/format'

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#15803d', '#86efac', '#166534', '#bbf7d0', '#65a30d']

const CHART_HEIGHT = 320

export function SpendingByCategoryChart() {
  const { data, isLoading } = useExpensesByCategory()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4" role="status" aria-label="Loading">
        <Loader2 className="size-5 animate-spin text-green-700 dark:text-[#86efac]" />
      </div>
    )
  }

  const slices = data?.by_category ?? []
  const total = data?.total ?? 0

  if (slices.length === 0) {
    return (
      <div className="rounded-lg border border-green-100 dark:border-green-900 bg-white dark:bg-gray-900 p-4 text-center text-green-700 dark:text-[#86efac]">
        No expenses yet.
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 rounded-lg border border-green-100 dark:border-green-900 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold text-green-900 dark:text-[#d1fae5]">Spending by category</h2>
        <span className="font-mono text-green-800 dark:text-[#4ade80]">{fmtMoney(total)}</span>
      </div>
      <div className="w-full min-w-0" style={{ height: CHART_HEIGHT }}>
        {mounted && (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT} minWidth={0}>
            <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={120}
              paddingAngle={2}
            >
              {slices.map((entry, i) => (
                <Cell key={entry.category_id} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => fmtMoney(Number(value))} />
            <Legend />
          </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
