// Cache the exchange rates for 1 hour to avoid hitting the free API too often
let cache: { rates: Record<string, number>; expiry: number } | null = null

export async function GET() {
  const now = Date.now()
  if (cache && now < cache.expiry) {
    return Response.json({ rates: cache.rates })
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error('Exchange rate API unavailable')
    const data = (await res.json()) as { rates: Record<string, number> }
    cache = { rates: data.rates, expiry: now + 60 * 60 * 1000 }
    return Response.json({ rates: data.rates })
  } catch {
    // Return a minimal fallback (USD only) so the UI doesn't break
    return Response.json({ rates: { USD: 1 } }, { status: 200 })
  }
}
