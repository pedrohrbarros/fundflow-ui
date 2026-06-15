import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const useExpensesByCategory = vi.fn()
vi.mock('@/hooks/use-expenses-by-category', () => ({ useExpensesByCategory: () => useExpensesByCategory() }))
vi.mock('recharts', async (orig) => {
  const actual = await orig<typeof import('recharts')>()
  return { ...actual, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div style={{ width: 400, height: 320 }}>{children}</div> }
})
import { SpendingByCategoryChart } from './SpendingByCategoryChart'

describe('SpendingByCategoryChart', () => {
  it('shows the empty state when there is no data', () => {
    useExpensesByCategory.mockReturnValue({ data: { by_category: [], total: 0 }, isLoading: false })
    render(<SpendingByCategoryChart />)
    expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument()
  })

  it('renders the heading when there are slices', () => {
    useExpensesByCategory.mockReturnValue({ data: { by_category: [{ category_id: 1, name: 'Food', total: 100, count: 2 }], total: 100 }, isLoading: false })
    render(<SpendingByCategoryChart />)
    expect(screen.getByText(/spending by category/i)).toBeInTheDocument()
  })
})
