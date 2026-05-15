import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { IncomeSection } from './IncomeSection'

vi.mock('@/hooks/use-sources-of-income', () => ({
  useSourcesOfIncome: () => ({
    data: {
      sources_of_income: [
        { id: '1', name: 'Salary', category_id: '1', income: 5000, created_at: '', updated_at: '' },
        { id: '2', name: 'Freelance', category_id: '2', income: 1200, created_at: '', updated_at: '' },
      ],
    },
    isLoading: false,
  }),
  useCreateSourceOfIncome: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateSourceOfIncome: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteSourceOfIncome: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/use-categories', () => ({
  useCategories: () => ({
    data: {
      categories: [
        { id: '1', name: 'Employment', created_at: '', updated_at: '' },
        { id: '2', name: 'Side Work', created_at: '', updated_at: '' },
      ],
    },
  }),
}))

describe('IncomeSection', () => {
  it('renders income sources with amounts', () => {
    render(<IncomeSection />)
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('Freelance')).toBeInTheDocument()
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()
  })

  it('shows total income in the total row', () => {
    render(<IncomeSection />)
    expect(screen.getByText('$6,200.00')).toBeInTheDocument()
  })

  it('shows name and amount inputs when Add button is clicked', async () => {
    render(<IncomeSection />)
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    expect(screen.getByPlaceholderText('Source name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
  })
})
