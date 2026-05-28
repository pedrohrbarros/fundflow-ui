import { type NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type {
  CreateSourceOfIncomeBody,
  SourceOfIncome,
  SourcesOfIncomeResponse,
} from '@/types'

export async function GET() {
  const result = await apiRequest<SourcesOfIncomeResponse>('/sources_of_income/search', {
    method: 'POST',
    body: {},
  })
  return Response.json(result.parsedData, { status: result.status })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateSourceOfIncomeBody
  const result = await apiRequest<SourceOfIncome>('/sources_of_income', { method: 'POST', body })
  return Response.json(result.parsedData, { status: result.status })
}
