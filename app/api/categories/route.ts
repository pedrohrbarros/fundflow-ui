import { type NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type { CategoriesResponse, Category, CreateCategoryBody } from '@/types'

export async function GET() {
  const result = await apiRequest<CategoriesResponse>('/categories/search', {
    method: 'POST',
    body: {},
  })
  return Response.json(result.parsedData, { status: result.status })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateCategoryBody
  const result = await apiRequest<Category>('/categories', { method: 'POST', body })
  return Response.json(result.parsedData, { status: result.status })
}
