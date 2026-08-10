/**
 * Normalises what someone typed into a money field to a `parseFloat`-friendly string.
 *
 * Money fields cannot be `<input type="number">`: a number input reports an empty
 * string for anything the browser cannot parse, so the decimal comma that most
 * mobile keyboards emit is swallowed before any handler sees it — typing "8,50"
 * would only ever yield "8". These are text inputs with `inputMode="decimal"`
 * instead, and the comma is translated here.
 */
export function normalizeAmountInput(value: string): string {
  const [whole, ...decimals] = value
    .replace(',', '.')
    .replace(/[^\d.]/g, '')
    .split('.')
  return decimals.length ? `${whole}.${decimals.join('')}` : whole
}

export function fmtMoney(n: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(n)
  } catch {
    return `${currency} ${n.toFixed(2)}`
  }
}
