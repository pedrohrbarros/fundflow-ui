import { describe, it, expect } from 'vitest'
import { getCountryCurrency, getCountryByCode } from './countries'

describe('countries', () => {
  it('resolves a known country currency', () => {
    expect(getCountryCurrency('BR')).toBe('BRL')
  })
  it('falls back to USD for an unknown country code', () => {
    expect(getCountryCurrency('ZZ')).toBe('USD')
  })
  it('resolves a known country by code', () => {
    expect(getCountryByCode('BR')?.code).toBe('BR')
  })
})
