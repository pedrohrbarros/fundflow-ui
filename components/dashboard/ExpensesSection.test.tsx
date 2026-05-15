import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ExpensesSection } from './ExpensesSection'

vi.mock('@/hooks/use-expenses', () => ({
  useExpenses: () => ({
    data: {
      expenses: [
        {
          id: '1', name: 'Rent', amount: 1200, is_paid: true, is_saved: false,
          saving_location: null, payment_methods: [], created_at: '', updated_at: '',
        },
        {
          id: '2', name: 'Groceries', amount: 400, is_paid: false, is_saved: false,
          saving_location: null, payment_methods: [], created_at: '', updated_at: '',
        },
      ],
      pagination: { page: 1, limit: 100, total: 2 },
    },
    isLoading: false,
  }),
  useCreateExpense: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateExpense: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteExpense: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('ExpensesSection', () => {
  it('renders expenses with amounts', () => {
    render(<ExpensesSection />)
    expect(screen.getByText('Rent')).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()
    expect(screen.getByText('$400.00')).toBeInTheDocument()
  })

  it('shows paid checkbox checked for paid expenses', () => {
    render(<ExpensesSection />)
    const checkboxes = screen.getAllByRole('checkbox')
    // Rent row: is_paid=true (first checkbox in row 1)
    expect(checkboxes[0]).toBeChecked()
    // Groceries row: is_paid=false (third checkbox, after Rent's is_saved)
    expect(checkboxes[2]).not.toBeChecked()
  })

  it('shows total expenses in the total row', () => {
    render(<ExpensesSection />)
    expect(screen.getByText('$1,600.00')).toBeInTheDocument()
  })

  it('shows name input when Add Expense button is clicked', async () => {
    render(<ExpensesSection />)
    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))
    expect(screen.getByPlaceholderText('Expense name')).toBeInTheDocument()
  })
})
