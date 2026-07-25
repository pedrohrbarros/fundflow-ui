import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExpensesSection } from './ExpensesSection'
import { useExpenses, useUpdateExpense } from '@/hooks/use-expenses'
import { usePaymentMethods } from '@/hooks/use-payment-methods'

const createMutate = vi.fn()
const deleteMutate = vi.fn()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      setQueriesData: vi.fn(),
      setQueryData: vi.fn(),
    }),
  }
})

vi.mock('@/providers/period-provider', () => ({
  usePeriod: () => ({ granularity: 'monthly', date: '2026-06-15', setGranularity: () => {}, setDate: () => {}, next: () => {}, prev: () => {} }),
}))

vi.mock('@/hooks/use-expenses', () => ({
  useExpenses: vi.fn(() => ({
    data: { expenses: [], total: 0, pagination: { page: 1, limit: 20, total: 0 } },
    isLoading: false,
  })),
  useCreateExpense: () => ({ mutate: createMutate, isPending: false }),
  useUpdateExpense: vi.fn(() => ({ mutate: vi.fn() })),
  useDeleteExpense: () => ({ mutate: deleteMutate }),
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

vi.mock('@/hooks/use-payment-methods', () => ({
  usePaymentMethods: vi.fn(() => ({ data: { payment_methods: [] } })),
}))

const sampleExpense = {
  id: 'e1',
  name: 'Rent',
  amount: 1200,
  period_amount: 1200,
  date: '2026-06-01',
  is_recurring: false,
  category_id: null,
  is_paid: false,
  is_saved: false,
  saving_location: null,
  payment_methods: [],
  created_at: '2026-06-01',
  updated_at: '2026-06-01',
}

describe('ExpensesSection', () => {
  beforeEach(() => {
    createMutate.mockClear()
    deleteMutate.mockClear()
    vi.mocked(useExpenses).mockReturnValue({
      data: { expenses: [], total: 0, pagination: { page: 1, limit: 20, total: 0 } },
      isLoading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(useUpdateExpense).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(usePaymentMethods).mockReturnValue({
      data: { payment_methods: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

  it('creates an expense without requiring a category', () => {
    render(<ExpensesSection />)

    // Open the expense modal (empty-state round button has aria-label "Add expense")
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))

    fireEvent.change(screen.getByPlaceholderText('Expense name'), { target: { value: 'Rent' } })
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1200' } })

    // Save is enabled without choosing a category; date defaults to the period date
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(createMutate).toHaveBeenCalledTimes(1)
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      name: 'Rent',
      amount: 1200,
      category_id: null,
      date: '2026-06-15',
      is_recurring: false,
    })
  })

  it('keeps an unsaved checkbox toggle visible after a refetch returns unchanged data', () => {
    // Server always returns the original unpaid expense, even after a refetch.
    vi.mocked(useExpenses).mockReturnValue({
      data: { expenses: [sampleExpense], total: 1200, pagination: { page: 1, limit: 20, total: 1 } },
      isLoading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    // mutateAsync never resolves, so the edit must stay in the overlay (never committed/cleared).
    vi.mocked(useUpdateExpense).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(() => new Promise<void>(() => {})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const { rerender } = render(<ExpensesSection />)

    const [paidCheckbox] = screen.getAllByRole('checkbox')
    fireEvent.click(paidCheckbox)
    expect(paidCheckbox).toHaveAttribute('aria-checked', 'true')

    // Simulate a refetch that returns the original (unchanged) server data.
    rerender(<ExpensesSection />)

    // The overlay must survive: the toggle is still on, not reset to the server value.
    expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute('aria-checked', 'true')
  })

  it('queues a checkbox toggle as a draft instead of saving immediately', () => {
    const mutateAsync = vi.fn(() => new Promise<void>(() => {}))
    vi.mocked(useExpenses).mockReturnValue({
      data: { expenses: [sampleExpense], total: 1200, pagination: { page: 1, limit: 20, total: 1 } },
      isLoading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(useUpdateExpense).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    render(<ExpensesSection />)

    const [paidCheckbox] = screen.getAllByRole('checkbox')
    fireEvent.click(paidCheckbox)

    // The toggle shows up optimistically as a draft instead of persisting right away.
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(paidCheckbox).toHaveAttribute('aria-checked', 'true')
  })

  it('opens the expense modal from a row, with every field and a delete button', () => {
    vi.mocked(usePaymentMethods).mockReturnValue({
      data: { payment_methods: [{ id: 'pm-1', name: 'Visa', origin: 'Bank' }] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(useExpenses).mockReturnValue({
      data: {
        expenses: [{
          ...sampleExpense,
          payment_methods: [{ payment_method_id: 'pm-1', partial_amount: 50, name: 'Visa', origin: 'Bank' }],
        }],
        total: 1200,
        pagination: { page: 1, limit: 20, total: 1 },
      },
      isLoading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    render(<ExpensesSection />)

    // The table has no delete control of its own — deletion lives in the modal.
    expect(screen.queryByRole('button', { name: 'Delete expense' })).not.toBeInTheDocument()

    // Clicking the row opens the full form modal.
    fireEvent.click(screen.getAllByRole('button', { name: 'Rent' })[0])

    expect(screen.getByText('Edit expense')).toBeInTheDocument()
    // The method's amount is editable inside the modal, prefilled from the expense.
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    // Fields that used to live outside the modal are now part of it.
    expect(screen.getByDisplayValue('2026-06-01')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(deleteMutate).toHaveBeenCalledWith('e1')
  })
})
