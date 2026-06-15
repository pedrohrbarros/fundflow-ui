import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapper } from './test-utils'
import { useExchangeRates } from './use-exchange-rates'

describe('useExchangeRates', () => {
  beforeEach(() => vi.restoreAllMocks())
  it('fetches /api/exchange-rates and returns parsed rates', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: true, json: async () => ({ rates: { USD: 1, BRL: 5 } }) } as Response
    )
    const { result } = renderHook(() => useExchangeRates(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchMock.mock.calls[0][0]).toContain('/api/exchange-rates')
    expect(result.current.data).toEqual({ USD: 1, BRL: 5 })
  })
})
