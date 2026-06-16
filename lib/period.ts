export type Granularity = 'daily' | 'monthly' | 'annually'

function toISO(y: number, mIndex: number, day: number): string {
  const lastDay = new Date(y, mIndex + 1, 0).getDate()
  const d = Math.min(day, lastDay)
  return `${y}-${String(mIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function currentPeriodDate(): string {
  const now = new Date()
  return toISO(now.getFullYear(), now.getMonth(), now.getDate())
}

export function addPeriod(dateISO: string, granularity: Granularity, delta: number): string {
  const [y, m, d] = dateISO.split('-').map(Number)
  if (granularity === 'daily') {
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() + delta)
    return toISO(dt.getFullYear(), dt.getMonth(), dt.getDate())
  }
  if (granularity === 'monthly') {
    const target = (m - 1) + delta
    const ty = y + Math.floor(target / 12)
    const tm = ((target % 12) + 12) % 12
    return toISO(ty, tm, d)
  }
  return toISO(y + delta, m - 1, d)
}

export function formatPeriodLabel(dateISO: string, granularity: Granularity): string {
  const [y, m, d] = dateISO.split('-').map(Number)
  if (granularity === 'annually') return String(y)
  const dt = new Date(y, m - 1, d)
  if (granularity === 'monthly') return dt.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  return dt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
