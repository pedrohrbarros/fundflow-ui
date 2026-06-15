import type { NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type { User, UpdateUserCountryBody } from '@/types'

export async function GET() {
  const result = await apiRequest<User>('/users/me')
  return Response.json(result.parsedData, { status: result.status })
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as UpdateUserCountryBody
  const result = await apiRequest<User>('/users/me', { method: 'PATCH', body })
  return Response.json(result.parsedData, { status: result.status })
}

export async function DELETE() {
  const result = await apiRequest<unknown>('/users/me', { method: 'DELETE' })
  return new Response(null, { status: result.status })
}
