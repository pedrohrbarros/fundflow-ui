import { type NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type { CreateExpenseBody, Expense, ExpensesResponse } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const body: Record<string, unknown> = {}
  const granularity = searchParams.get('granularity')
  const date = searchParams.get('date')
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')
  if (granularity) body.granularity = granularity
  if (date) body.date = date
  if (page) body.page = Number(page)
  if (limit) body.limit = Number(limit)
  const filters = searchParams.get('filters')
  if (filters) {
    try { body.filters = JSON.parse(filters) } catch { /* ignore malformed filters */ }
  }

  const result = await apiRequest<ExpensesResponse>('/expenses/search', { method: 'POST', body })
  return Response.json(result.parsedData, { status: result.status })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateExpenseBody
  const result = await apiRequest<Expense>('/expenses', { method: 'POST', body })
  return Response.json(result.parsedData, { status: result.status })
}
