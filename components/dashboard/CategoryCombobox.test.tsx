import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/use-categories', () => ({
  useCategories: () => ({ data: { categories: [
    { id: 1, name: 'Salary', type: 'INCOME', created_at: '', updated_at: '' },
    { id: 2, name: 'Food', type: 'EXPENSE', created_at: '', updated_at: '' },
  ] } }),
  useCreateCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCategory: () => ({ mutate: vi.fn(), isPending: false }),
}))
import { CategoryCombobox } from './CategoryCombobox'

describe('CategoryCombobox', () => {
  it('lists only categories of the given type', async () => {
    render(<CategoryCombobox value="" onChange={() => {}} type="EXPENSE" placeholder="Select category…" />)

    // Open the popover by clicking the trigger
    fireEvent.click(screen.getByRole('button', { name: /select category/i }))

    expect(await screen.findByText('Food')).toBeInTheDocument()
    expect(screen.queryByText('Salary')).toBeNull()
  })

  it('calls onChange with the chosen category id', async () => {
    const onChange = vi.fn()
    render(<CategoryCombobox value="" onChange={onChange} type="EXPENSE" placeholder="Select category…" />)

    fireEvent.click(screen.getByRole('button', { name: /select category/i }))
    fireEvent.click(await screen.findByText('Food'))

    expect(onChange).toHaveBeenCalledWith('2')
  })
})
