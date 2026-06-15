import { describe, it, expect } from 'vitest'
import { convertCurrency } from './currency'

const rates = { USD: 1, BRL: 5 }

describe('convertCurrency', () => {
  it('converts between currencies via rates', () => {
    expect(convertCurrency(10, 'USD', 'BRL', rates)).toBe(50)
  })
  it('returns null when a rate is missing', () => {
    expect(convertCurrency(10, 'USD', 'JPY', rates)).toBeNull()
  })
})
