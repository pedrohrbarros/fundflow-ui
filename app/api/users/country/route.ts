import type { NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type { User, UpdateUserCountryBody } from '@/types'

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as UpdateUserCountryBody
  const result = await apiRequest<User>('/users/country', { method: 'PATCH', body })
  return Response.json(result.parsedData, { status: result.status })
}
