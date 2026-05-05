import { type NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type { Category, UpdateCategoryBody } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = (await request.json()) as UpdateCategoryBody
  const result = await apiRequest<Category>(`/categories/${id}`, { method: 'PATCH', body })
  return Response.json(result.parsedData, { status: result.status })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await apiRequest<Category>(`/categories/${id}`, { method: 'DELETE' })
  return Response.json(result.parsedData, { status: result.status })
}
