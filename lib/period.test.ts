import { describe, it, expect } from 'vitest'
import { addPeriod, formatPeriodLabel } from './period'

describe('addPeriod', () => {
  it('moves by one day in daily granularity', () => {
    expect(addPeriod('2026-06-15', 'daily', 1)).toBe('2026-06-16')
    expect(addPeriod('2026-06-01', 'daily', -1)).toBe('2026-05-31')
  })
  it('moves by one month, clamping the day to month length', () => {
    expect(addPeriod('2026-01-31', 'monthly', 1)).toBe('2026-02-28')
    expect(addPeriod('2026-06-15', 'monthly', -1)).toBe('2026-05-15')
    expect(addPeriod('2026-12-10', 'monthly', 1)).toBe('2027-01-10')
  })
  it('moves by one year, clamping Feb 29', () => {
    expect(addPeriod('2024-02-29', 'annually', 1)).toBe('2025-02-28')
    expect(addPeriod('2026-06-15', 'annually', -1)).toBe('2025-06-15')
  })
})

describe('formatPeriodLabel', () => {
  it('formats per granularity', () => {
    expect(formatPeriodLabel('2026-06-05', 'annually')).toBe('2026')
    expect(formatPeriodLabel('2026-06-05', 'monthly')).toBe('June 2026')
    expect(formatPeriodLabel('2026-06-05', 'daily')).toBe('Jun 5, 2026')
  })
})
