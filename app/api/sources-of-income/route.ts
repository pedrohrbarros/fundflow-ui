import { type NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type {
  CreateSourceOfIncomeBody,
  SourceOfIncome,
  SourcesOfIncomeByCategoryResponse,
} from '@/types'

export async function GET() {
  const result = await apiRequest<SourcesOfIncomeByCategoryResponse>('/sources_of_income')
  return Response.json(result.parsedData, { status: result.status })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateSourceOfIncomeBody
  const result = await apiRequest<SourceOfIncome>('/sources_of_income', { method: 'POST', body })
  return Response.json(result.parsedData, { status: result.status })
}
