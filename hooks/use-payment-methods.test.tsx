import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapper } from './test-utils'
import { usePaymentMethods } from './use-payment-methods'

describe('usePaymentMethods', () => {
  beforeEach(() => vi.restoreAllMocks())
  it('fetches /api/payment-methods and returns parsed data', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: true, json: async () => ({ payment_methods: [], pagination: { page: 1, limit: 20, total: 0 } }) } as Response
    )
    const { result } = renderHook(() => usePaymentMethods(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchMock.mock.calls[0][0]).toContain('/api/payment-methods')
    expect(result.current.data?.payment_methods).toEqual([])
  })
})
