import { render, screen, fireEvent } from '@testing-library/react'
import { BalanceSummary } from './BalanceSummary'

describe('BalanceSummary', () => {
  it('displays formatted income, expenses, and positive remaining', () => {
    render(<BalanceSummary totalIncome={5000} totalExpenses={3200} />)
    expect(screen.getByText('Total Income')).toBeInTheDocument()
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    expect(screen.getByText('Total Expenses')).toBeInTheDocument()
    expect(screen.getByText('$3,200.00')).toBeInTheDocument()
    expect(screen.getByText('Remaining')).toBeInTheDocument()
    expect(screen.getByText('$1,800.00')).toBeInTheDocument()
  })

  it('shows remaining in red when expenses exceed income', () => {
    render(<BalanceSummary totalIncome={1000} totalExpenses={1500} />)
    const remaining = screen.getByTestId('remaining-amount')
    expect(remaining).toHaveClass('text-red-600')
    expect(screen.getByText('-$500.00')).toBeInTheDocument()
  })

  it('shows remaining in green when income exceeds expenses', () => {
    render(<BalanceSummary totalIncome={2000} totalExpenses={500} />)
    const remaining = screen.getByTestId('remaining-amount')
    expect(remaining).toHaveClass('text-green-600')
  })

  it('calls onManageIncome when the manage income button is clicked', () => {
    const mockFn = vi.fn()
    render(<BalanceSummary totalIncome={1000} totalExpenses={500} onManageIncome={mockFn} />)
    const button = screen.getByRole('button', { name: 'Manage income sources' })
    fireEvent.click(button)
    expect(mockFn).toHaveBeenCalledOnce()
  })
})
