import { type NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type { CreateExpenseBody, Expense, ExpensesResponse } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const params: Record<string, string> = {}
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')
  if (page) params.page = page
  if (limit) params.limit = limit

  const result = await apiRequest<ExpensesResponse>('/expenses', {
    searchParams: Object.keys(params).length > 0 ? params : undefined,
  })
  return Response.json(result.parsedData, { status: result.status })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateExpenseBody
  const result = await apiRequest<Expense>('/expenses', { method: 'POST', body })
  return Response.json(result.parsedData, { status: result.status })
}
