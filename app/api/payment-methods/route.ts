import { type NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type { CreatePaymentMethodBody, PaymentMethod, PaymentMethodsResponse } from '@/types'

// The backend caps a user at 100 payment methods, so this returns all of them.
// The default of 20 silently hid the rest, leaving them unpickable.
export async function GET() {
  const result = await apiRequest<PaymentMethodsResponse>('/payment_methods/search', {
    method: 'POST',
    body: { limit: 100 },
  })
  return Response.json(result.parsedData, { status: result.status })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreatePaymentMethodBody
  const result = await apiRequest<PaymentMethod>('/payment_methods', { method: 'POST', body })
  return Response.json(result.parsedData, { status: result.status })
}
