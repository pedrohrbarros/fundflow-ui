import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CategoriesSection } from './CategoriesSection'

const { mockMutate } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
}))

vi.mock('@/hooks/use-categories', () => ({
  useCategories: () => ({
    data: {
      categories: [
        { id: '1', name: 'Housing', created_at: '', updated_at: '' },
        { id: '2', name: 'Food', created_at: '', updated_at: '' },
      ],
    },
    isLoading: false,
  }),
  useCreateCategory: () => ({ mutate: mockMutate, isPending: false }),
  useUpdateCategory: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCategory: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('CategoriesSection', () => {
  it('renders existing categories', () => {
    render(<CategoriesSection />)
    expect(screen.getByText('Housing')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
  })

  it('shows add row when Add Category button is clicked', async () => {
    render(<CategoriesSection />)
    await userEvent.click(screen.getByRole('button', { name: /add category/i }))
    expect(screen.getByPlaceholderText('Category name')).toBeInTheDocument()
  })

  it('calls createCategory with the entered name when Save is clicked', async () => {
    render(<CategoriesSection />)
    await userEvent.click(screen.getByRole('button', { name: /add category/i }))
    await userEvent.type(screen.getByPlaceholderText('Category name'), 'Transport')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(mockMutate).toHaveBeenCalledWith(
      { name: 'Transport' },
      expect.any(Object)
    )
  })
})
