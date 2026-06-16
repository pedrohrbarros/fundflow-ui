import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const setGranularity = vi.fn()
const next = vi.fn()
const prev = vi.fn()
vi.mock('@/providers/period-provider', () => ({
  usePeriod: () => ({ granularity: 'monthly', date: '2026-06-15', setGranularity, setDate: vi.fn(), next, prev }),
}))
import { PeriodSelector } from './PeriodSelector'

describe('PeriodSelector', () => {
  it('shows the monthly label and navigates', () => {
    render(<PeriodSelector />)
    expect(screen.getByText('June 2026')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /previous period/i }))
    expect(prev).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /next period/i }))
    expect(next).toHaveBeenCalled()
  })
  it('switches granularity', () => {
    render(<PeriodSelector />)
    fireEvent.click(screen.getByRole('button', { name: /^daily$/i }))
    expect(setGranularity).toHaveBeenCalledWith('daily')
  })
})
