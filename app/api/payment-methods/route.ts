import { type NextRequest } from 'next/server'
import { apiRequest } from '@/lib/api'
import type { CreatePaymentMethodBody, PaymentMethod, PaymentMethodsResponse } from '@/types'

export async function GET() {
  const result = await apiRequest<PaymentMethodsResponse>('/payment_methods')
  return Response.json(result.parsedData, { status: result.status })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreatePaymentMethodBody
  const result = await apiRequest<PaymentMethod>('/payment_methods', { method: 'POST', body })
  return Response.json(result.parsedData, { status: result.status })
}
