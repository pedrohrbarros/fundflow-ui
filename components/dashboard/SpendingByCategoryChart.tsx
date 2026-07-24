'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useExpensesByCategory } from '@/hooks/use-expenses-by-category'
import { fmtMoney } from '@/lib/format'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

const CHART_HEIGHT = 320

export function SpendingByCategoryChart() {
  const { data, isLoading } = useExpensesByCategory()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4" role="status" aria-label="Loading">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    )
  }

  const slices = data?.by_category ?? []
  const total = data?.total ?? 0

  if (slices.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-muted-foreground">
        No expenses yet.
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Spending by category</h2>
        <span className="tabular-nums text-primary">{fmtMoney(total)}</span>
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
            <Tooltip
              formatter={(value) => fmtMoney(Number(value))}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 'calc(var(--radius) - 2px)',
                color: 'var(--popover-foreground)',
              }}
              labelStyle={{ color: 'var(--popover-foreground)' }}
              itemStyle={{ color: 'var(--popover-foreground)' }}
            />
            <Legend />
          </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
