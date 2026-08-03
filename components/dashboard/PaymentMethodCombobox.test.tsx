import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/use-payment-methods', () => ({
  usePaymentMethods: () => ({ data: { payment_methods: [
    { id: 'pm-1', name: 'Visa', origin: 'Bank', created_at: '', updated_at: '' },
    { id: 'pm-2', name: 'Cash', origin: 'Wallet', created_at: '', updated_at: '' },
  ] } }),
  useCreatePaymentMethod: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdatePaymentMethod: () => ({ mutate: vi.fn(), isPending: false }),
  useDeletePaymentMethod: () => ({ mutate: vi.fn(), isPending: false }),
}))
import { PaymentMethodCombobox } from './PaymentMethodCombobox'

describe('PaymentMethodCombobox', () => {
  it('calls onChange with the chosen payment method id', async () => {
    const onChange = vi.fn()
    render(<PaymentMethodCombobox value="" onChange={onChange} placeholder="Credit Card" />)

    fireEvent.click(screen.getByRole('button', { name: /credit card/i }))
    fireEvent.click(await screen.findByText('Visa'))

    expect(onChange).toHaveBeenCalledWith('pm-1')
  })

  it('clears the selection when the no-payment-method row is chosen', async () => {
    const onChange = vi.fn()
    render(<PaymentMethodCombobox value="pm-1" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /visa/i }))
    fireEvent.click(await screen.findByText('No payment method'))

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('filters the list by name or origin', async () => {
    render(<PaymentMethodCombobox value="" onChange={vi.fn()} placeholder="Credit Card" />)

    fireEvent.click(screen.getByRole('button', { name: /credit card/i }))
    expect(await screen.findByText('Visa')).toBeInTheDocument()

    // Matching on origin, not just name.
    fireEvent.change(screen.getByLabelText('Search payment methods'), {
      target: { value: 'wallet' },
    })

    expect(screen.getByText('Cash')).toBeInTheDocument()
    expect(screen.queryByText('Visa')).not.toBeInTheDocument()
  })
})
