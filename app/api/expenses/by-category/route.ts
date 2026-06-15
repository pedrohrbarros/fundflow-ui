import { apiRequest } from '@/lib/api'
import type { ExpensesByCategoryResponse } from '@/types'

export async function GET() {
  const result = await apiRequest<ExpensesByCategoryResponse>('/expenses/by-category', {
    method: 'POST',
    body: {},
  })
  return Response.json(result.parsedData, { status: result.status })
}
