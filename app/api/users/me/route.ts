import { apiRequest } from '@/lib/api'
import type { User } from '@/types'

export async function GET() {
  const result = await apiRequest<User>('/users/me')
  return Response.json(result.parsedData, { status: result.status })
}
