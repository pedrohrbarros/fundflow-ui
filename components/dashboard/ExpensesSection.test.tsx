import { render, screen, fireEvent, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExpensesSection } from './ExpensesSection'
import { useExpenses, useUpdateExpense } from '@/hooks/use-expenses'
import { usePaymentMethods } from '@/hooks/use-payment-methods'

const createMutate = vi.fn()
const createMutateAsync = vi.fn((_body: unknown) => Promise.resolve({}))
const deleteMutate = vi.fn()

// Capture what the shared toast renders so its Save/Discard can be driven
// without mounting sonner's Toaster.
let capturedToast: ((t: number) => ReactNode) | null = null

// Stands in for sonner's own behaviour: an id it has already issued updates that
// toast in place, anything else opens a new one.
type ToastOptions = { id?: number | string; duration?: number }
const toastCustom = vi.fn((renderToast: (t: number) => ReactNode, options?: ToastOptions) => {
  capturedToast = renderToast
  return options?.id ?? 1
})
const toastDismiss = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    custom: (renderToast: (t: number) => ReactNode, options?: ToastOptions) =>
      toastCustom(renderToast, options),
    dismiss: (id?: number | string) => toastDismiss(id),
    error: vi.fn(),
  },
}))

async function clickInToast(name: string) {
  if (!capturedToast) throw new Error('no toast was shown')
  const toastRender = render(<>{capturedToast(1)}</>)
  await act(async () => {
    fireEvent.click(toastRender.getByRole('button', { name }))
  })
}

const saveFromToast = () => clickInToast('Save')
const discardFromToast = () => clickInToast('Discard')

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
  useCreateExpense: () => ({ mutate: createMutate, mutateAsync: createMutateAsync, isPending: false }),
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
  PaymentMethodCombobox: ({ onChange }: { onChange: (id: string) => void }) => (
    <button type="button" onClick={() => onChange('pm-1')}>
      pick-payment-method
    </button>
  ),
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
  recurring_months: null,
  category_id: null,
  is_paid: false,
  is_saved: false,
  saving_location: null,
  payment_method_id: null,
  payment_method: null,
  created_at: '2026-06-01',
  updated_at: '2026-06-01',
}

function mockExpenses(expenses: unknown[]) {
  vi.mocked(useExpenses).mockReturnValue({
    data: { expenses, total: 1200, pagination: { page: 1, limit: 20, total: expenses.length } },
    isLoading: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

describe('ExpensesSection', () => {
  beforeEach(() => {
    createMutate.mockClear()
    createMutateAsync.mockClear()
    deleteMutate.mockClear()
    toastCustom.mockClear()
    toastDismiss.mockClear()
    capturedToast = null
    mockExpenses([])
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

  it('offers a new expense to the shared toast instead of its own Save button', async () => {
    render(<ExpensesSection />)

    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))

    fireEvent.change(screen.getByPlaceholderText('Expense name'), { target: { value: 'Rent' } })
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1200' } })

    // The add row only offers Cancel now; saving goes through the toast.
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    expect(createMutateAsync).not.toHaveBeenCalled()

    await saveFromToast()

    expect(createMutateAsync).toHaveBeenCalledTimes(1)
    // No date input exists any more, so the period date is the anchor.
    expect(createMutateAsync.mock.calls[0][0]).toMatchObject({
      name: 'Rent',
      amount: 1200,
      category_id: null,
      date: '2026-06-15',
      is_recurring: false,
      payment_method_id: null,
    })
  })

  it('updates the open toast in place while typing instead of reopening it', () => {
    render(<ExpensesSection />)

    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))
    fireEvent.change(screen.getByPlaceholderText('Expense name'), { target: { value: 'Rent' } })

    const amountField = screen.getByPlaceholderText('0.00')
    // The draft becomes saveable here, which is what opens the toast.
    fireEvent.change(amountField, { target: { value: '1' } })
    const openedId = toastCustom.mock.results.at(-1)?.value
    toastDismiss.mockClear()

    fireEvent.change(amountField, { target: { value: '12' } })
    fireEvent.change(amountField, { target: { value: '120' } })

    // Each further character must address the toast already on screen. Omitting
    // the id would open a second toast, replaying the enter animation per keystroke.
    const laterCalls = toastCustom.mock.calls.slice(-2)
    expect(laterCalls.map(([, options]) => options?.id)).toEqual([openedId, openedId])
    expect(toastDismiss).not.toHaveBeenCalled()
  })

  it('never saves the new expense on its own, however long the user pauses', () => {
    vi.useFakeTimers()
    try {
      render(<ExpensesSection />)

      fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))
      fireEvent.change(screen.getByPlaceholderText('Expense name'), { target: { value: 'Rent' } })
      fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1200' } })

      act(() => {
        vi.advanceTimersByTime(60_000)
      })

      // Saving is the Save button's job alone; pausing must not persist anything.
      expect(createMutateAsync).not.toHaveBeenCalled()
      expect(toastDismiss).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('discards the new expense when the toast is discarded', async () => {
    render(<ExpensesSection />)

    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))
    fireEvent.change(screen.getByPlaceholderText('Expense name'), { target: { value: 'Rent' } })
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1200' } })

    await discardFromToast()

    expect(createMutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('Expense name')).not.toBeInTheDocument()
  })

  it('keeps an unsaved checkbox toggle visible after a refetch returns unchanged data', () => {
    // Server always returns the original unpaid expense, even after a refetch.
    mockExpenses([sampleExpense])
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
    mockExpenses([sampleExpense])
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

  it('edits a name in place on desktop instead of opening a modal', () => {
    mockExpenses([sampleExpense])

    render(<ExpensesSection />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Rent' })[0])

    // The field becomes an input in the row; no edit dialog is mounted.
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
    expect(screen.queryByText('Edit expense')).not.toBeInTheDocument()
  })

  it('deletes from the table row and toggles Saved there too', () => {
    mockExpenses([sampleExpense])

    render(<ExpensesSection />)

    // Paid, Recurring and Saved are all inline toggles now.
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: 'Delete expense' }))
    expect(deleteMutate.mock.calls[0][0]).toBe('e1')
  })

  it('keeps the payment method shown when another field is toggled', () => {
    // Ids arrive from the API as numbers, and the methods query is paginated,
    // so a row's method may be missing from it — the row's own embedded record
    // has to survive an unrelated edit.
    mockExpenses([
      {
        ...sampleExpense,
        id: 1,
        payment_method_id: 4,
        payment_method: { id: 4, name: 'Nubank', origin: 'Bank' },
      },
    ])
    vi.mocked(usePaymentMethods).mockReturnValue({
      data: { payment_methods: [{ id: 99, name: 'Other', origin: 'Bank' }] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(useUpdateExpense).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(() => new Promise<void>(() => {})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    render(<ExpensesSection />)

    const [, , savedCheckbox] = screen.getAllByRole('checkbox')
    fireEvent.click(savedCheckbox)

    expect(screen.getByText('Nubank')).toBeInTheDocument()
  })

  it('keeps the months-limit button in place but disabled until an expense recurs', () => {
    mockExpenses([sampleExpense])

    render(<ExpensesSection />)

    // It holds its slot so the recurring column stays aligned row to row.
    expect(screen.getByRole('button', { name: 'Set a months limit' })).toBeDisabled()

    const [, recurringCheckbox] = screen.getAllByRole('checkbox')
    fireEvent.click(recurringCheckbox)

    expect(screen.getByRole('button', { name: 'Set a months limit' })).toBeEnabled()
  })
})
