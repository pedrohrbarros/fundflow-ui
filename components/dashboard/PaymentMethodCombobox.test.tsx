import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/use-payment-methods', () => ({
  usePaymentMethods: () => ({ data: { payment_methods: [
    { id: 'pm-1', name: 'Visa', origin: 'Bank', created_at: '', updated_at: '' },
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
})
