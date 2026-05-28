/**
 * Convert an amount from one currency to another using USD as the pivot.
 * `rates` is a Record<string, number> where rates[X] = how many X per 1 USD.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount
  const rateFrom = rates[fromCurrency]
  const rateTo = rates[toCurrency]
  if (!rateFrom || !rateTo) return amount
  // Convert to USD first, then to target
  return (amount / rateFrom) * rateTo
}
