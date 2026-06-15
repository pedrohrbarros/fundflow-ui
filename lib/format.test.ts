import { describe, it, expect } from 'vitest'
import { fmtMoney } from './format'

describe('fmtMoney', () => {
  it('formats a known currency amount', () => {
    expect(fmtMoney(1234.5, 'USD')).toContain('1,234.50')
  })
  it('falls back gracefully on an invalid currency code', () => {
    expect(fmtMoney(10, 'NOTACURRENCY')).toContain('10')
  })
})
