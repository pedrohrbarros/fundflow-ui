import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      getQueryData: vi.fn(),
      setQueryData: vi.fn(),
    }),
  }
})

vi.mock('@/providers/period-provider', () => ({
  usePeriod: () => ({ granularity: 'monthly', date: '2026-06-15', setGranularity: () => {}, setDate: () => {}, next: () => {}, prev: () => {} }),
}))

vi.mock('@/hooks/use-sources-of-income', () => ({
  useSourcesOfIncome: () => ({ data: { sources_of_income: [], total: {} }, isLoading: false }),
  useCreateSourceOfIncome: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateSourceOfIncome: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useDeleteSourceOfIncome: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/use-categories', () => ({
  useCategories: () => ({ data: { categories: [] } }),
}))

// Replace the combobox with a trivial control that selects category "5"
vi.mock('./CategoryCombobox', () => ({
  CategoryCombobox: ({ onChange }: { onChange: (id: string) => void }) => (
    <button type="button" onClick={() => onChange('5')}>
      pick-category
    </button>
  ),
}))

import { IncomeModal } from './IncomeModal'

describe('IncomeModal', () => {
  it('enables Save without a category once income is set', async () => {
    render(<IncomeModal open onClose={() => {}} />)

    // Empty-state add button opens the add row
    fireEvent.click(await screen.findByRole('button', { name: 'Add income' }))

    // Save stays disabled until income > 0
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    // Fill name + amount, but no category
    fireEvent.change(screen.getByPlaceholderText('Source name'), { target: { value: 'Freelance' } })
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '500' } })

    // Save is enabled without choosing a category
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })
})
