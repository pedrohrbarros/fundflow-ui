import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BalanceSummary } from './BalanceSummary'

describe('BalanceSummary', () => {
  it('renders income and expenses from props', () => {
    render(<BalanceSummary totalIncome={1000} totalExpenses={400} userCurrency="USD" onManageIncome={() => {}} />)
    expect(screen.getByText(/1,000/)).toBeInTheDocument()
    expect(screen.getByText(/400/)).toBeInTheDocument()
  })

  it('shows a negative remaining when expenses exceed income', () => {
    render(<BalanceSummary totalIncome={100} totalExpenses={400} userCurrency="USD" />)
    expect(screen.getByTestId('remaining-amount').textContent).toMatch(/^-/)
  })
})
