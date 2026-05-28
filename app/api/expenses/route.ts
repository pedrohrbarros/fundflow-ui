import { type NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type { CreateExpenseBody, Expense, ExpensesResponse } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const body: Record<string, number> = {}
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')
  if (page) body.page = Number(page)
  if (limit) body.limit = Number(limit)

  const result = await apiRequest<ExpensesResponse>('/expenses/search', {
    method: 'POST',
    body,
  })
  return Response.json(result.parsedData, { status: result.status })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateExpenseBody
  const result = await apiRequest<Expense>('/expenses', { method: 'POST', body })
  return Response.json(result.parsedData, { status: result.status })
}
