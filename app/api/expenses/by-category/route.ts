import { type NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type { ExpensesByCategoryResponse } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const body: Record<string, unknown> = {}
  const granularity = searchParams.get('granularity')
  const date = searchParams.get('date')
  if (granularity) body.granularity = granularity
  if (date) body.date = date

  const result = await apiRequest<ExpensesByCategoryResponse>('/expenses/by-category', { method: 'POST', body })
  return Response.json(result.parsedData, { status: result.status })
}
