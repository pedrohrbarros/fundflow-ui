import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExpensesSection } from './ExpensesSection'

const createMutate = vi.fn()

vi.mock('@/hooks/use-expenses', () => ({
  useExpenses: () => ({
    data: { expenses: [], pagination: { page: 1, limit: 20, total: 0 } },
    isLoading: false,
  }),
  useCreateExpense: () => ({ mutate: createMutate, isPending: false }),
  useUpdateExpense: () => ({ mutate: vi.fn() }),
  useDeleteExpense: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/hooks/use-categories', () => ({
  useCategories: () => ({ data: { categories: [] } }),
}))

// Replace the combobox with a trivial control that selects category "7"
vi.mock('@/components/dashboard/CategoryCombobox', () => ({
  CategoryCombobox: ({ onChange }: { onChange: (id: string) => void }) => (
    <button type="button" onClick={() => onChange('7')}>
      pick-category
    </button>
  ),
}))

vi.mock('@/components/dashboard/PaymentMethodCombobox', () => ({
  PaymentMethodCombobox: () => <div>payment-method</div>,
}))

describe('ExpensesSection', () => {
  beforeEach(() => {
    createMutate.mockClear()
  })

  it('requires a category before an expense can be created', () => {
    render(<ExpensesSection />)

    // Open the add row (empty-state round button has aria-label "Add expense")
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))

    fireEvent.change(screen.getByPlaceholderText('Work'), { target: { value: 'Rent' } })
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1200' } })

    // No category selected yet -> Save is not shown
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()

    // Select a category via the mocked combobox
    fireEvent.click(screen.getByText('pick-category'))

    // Save now appears; clicking it submits with category_id
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(createMutate).toHaveBeenCalledTimes(1)
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      name: 'Rent',
      amount: 1200,
      category_id: 7,
    })
  })
})
