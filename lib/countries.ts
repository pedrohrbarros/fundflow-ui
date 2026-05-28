import { countries, getEmojiFlag } from 'countries-list'

export type Country = {
  code: string     // ISO alpha-2, e.g. "BR"
  name: string     // Display name, e.g. "Brazil"
  currency: string // ISO 4217, e.g. "BRL"
  flag: string     // Emoji, e.g. "🇧🇷"
}

export const COUNTRIES: Country[] = Object.entries(countries)
  .map(([code, data]) => ({
    code,
    name: data.name,
    currency: data.currency[0] ?? 'USD',
    flag: getEmojiFlag(code as Parameters<typeof getEmojiFlag>[0]),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code)
}

export function getCountryCurrency(countryCode: string): string {
  return getCountryByCode(countryCode)?.currency ?? 'USD'
}
