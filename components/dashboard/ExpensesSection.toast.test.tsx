import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Toaster } from 'sonner'
import { ExpensesSection } from './ExpensesSection'

// The sibling suite mocks sonner to drive the toast directly. This one runs the
// real thing instead, because the toast's own id handling is what breaks: only
// a real Toaster can tell whether "Save your changes?" actually leaves the screen.

const createMutateAsync = vi.fn(() => Promise.resolve({}))

vi.mock('@tanstack/react-query', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({ setQueriesData: vi.fn(), setQueryData: vi.fn() }),
  }
})

vi.mock('@/providers/period-provider', () => ({
  usePeriod: () => ({ granularity: 'monthly', date: '2026-06-15' }),
}))

vi.mock('@/hooks/use-expenses', () => ({
  useExpenses: () => ({
    data: { expenses: [], total: 0, pagination: { page: 1, limit: 20, total: 0 } },
    isLoading: false,
  }),
  useCreateExpense: () => ({ mutateAsync: createMutateAsync, mutate: vi.fn(), isPending: false }),
  useUpdateExpense: () => ({ mutateAsync: vi.fn(), mutate: vi.fn() }),
  useDeleteExpense: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/hooks/use-categories', () => ({ useCategories: () => ({ data: { categories: [] } }) }))
vi.mock('@/hooks/use-payment-methods', () => ({
  usePaymentMethods: () => ({ data: { payment_methods: [] } }),
}))
vi.mock('@/components/dashboard/CategoryCombobox', () => ({ CategoryCombobox: () => null }))
vi.mock('@/components/dashboard/PaymentMethodCombobox', () => ({ PaymentMethodCombobox: () => null }))

// Sonner leaves the toast on screen for an exit animation before unmounting it,
// and each step of that needs its own React flush to land.
async function settle() {
  for (let elapsed = 0; elapsed < 500; elapsed += 50) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
  }
}

async function openSaveToast() {
  render(
    <>
      <ExpensesSection />
      <Toaster />
    </>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))
  fireEvent.change(screen.getByPlaceholderText('Expense name'), { target: { value: 'Rent' } })
  fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1200' } })
  await settle()
  expect(screen.getByText('Save your changes?')).toBeInTheDocument()
}

async function clickInToast(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
  await settle()
}

describe('the shared save toast leaves the screen', () => {
  beforeEach(() => {
    createMutateAsync.mockClear()
    createMutateAsync.mockImplementation(() => Promise.resolve({}))
  })

  it('once the save succeeds', async () => {
    await openSaveToast()

    await clickInToast('Save')

    expect(createMutateAsync).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Save your changes?')).not.toBeInTheDocument()
  })

  it('once the save fails', async () => {
    createMutateAsync.mockImplementation(() => Promise.reject(new Error('boom')))
    await openSaveToast()

    await clickInToast('Save')

    expect(screen.queryByText('Save your changes?')).not.toBeInTheDocument()
  })

  it('when the changes are discarded', async () => {
    await openSaveToast()

    await clickInToast('Discard')

    expect(createMutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByText('Save your changes?')).not.toBeInTheDocument()
  })
})
