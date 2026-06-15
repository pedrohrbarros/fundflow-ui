import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mutate = vi.fn()
vi.mock('@/hooks/use-user', () => ({
  useCurrentUser: () => ({ data: { id: '1', email: 'a@b.c', country: 'BR', created_at: '', updated_at: '' } }),
  useUpdateUserCountry: () => ({ mutate, isPending: false }),
}))
import { CountryPicker } from './CountryPicker'

describe('CountryPicker', () => {
  it('updates the country when a different one is chosen', () => {
    render(<CountryPicker />)

    // Open the picker
    fireEvent.click(screen.getByRole('button', { name: /select country/i }))

    // Narrow the list to a single country, then pick it
    fireEvent.change(screen.getByPlaceholderText(/search country/i), { target: { value: 'United States' } })
    fireEvent.click(screen.getByRole('button', { name: /united states/i }))

    expect(mutate).toHaveBeenCalledWith({ country: 'US' })
  })
})
