import { type NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type { SourceOfIncome, UpdateSourceOfIncomeBody } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = (await request.json()) as UpdateSourceOfIncomeBody
  const result = await apiRequest<SourceOfIncome>(`/sources_of_income/${id}`, {
    method: 'PATCH',
    body,
  })
  return Response.json(result.parsedData, { status: result.status })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await apiRequest<SourceOfIncome>(`/sources_of_income/${id}`, { method: 'DELETE' })
  return Response.json(result.parsedData, { status: result.status })
}
