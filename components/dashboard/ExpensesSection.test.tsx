import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExpensesSection } from './ExpensesSection'
import { useExpenses, useUpdateExpense } from '@/hooks/use-expenses'

const createMutate = vi.fn()

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

vi.mock('@/hooks/use-payment-methods', () => ({
  usePaymentMethods: () => ({ data: { payment_methods: [] } }),
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
  })

  it('creates an expense without requiring a category', () => {
    render(<ExpensesSection />)

    // Open the add row (empty-state round button has aria-label "Add expense")
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))

    fireEvent.change(screen.getByPlaceholderText('Work'), { target: { value: 'Rent' } })
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1200' } })

    // Save is shown without choosing a category; date is set automatically to the period date
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

  it('keeps an unsaved inline name edit visible after a refetch returns unchanged data', () => {
    // Server always returns the original "Rent" expense, even after a refetch.
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

    // Enter edit mode on the name cell, change it, then blur to commit to the overlay via toast.
    fireEvent.click(screen.getByRole('button', { name: 'Rent' }))
    const input = screen.getByDisplayValue('Rent')
    fireEvent.change(input, { target: { value: 'Mortgage' } })
    fireEvent.blur(input)

    // Edit is now in the overlay (pending changes). Rendered in both the
    // desktop table and the mobile list, so there may be more than one match.
    expect(screen.getAllByText('Mortgage').length).toBeGreaterThan(0)

    // Simulate a refetch that returns the original (unchanged) server data.
    rerender(<ExpensesSection />)

    // The overlay must survive: the edited name is still shown, not the server "Rent".
    expect(screen.getAllByText('Mortgage').length).toBeGreaterThan(0)
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
})
