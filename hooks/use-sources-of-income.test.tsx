import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapper } from './test-utils'
import { useSourcesOfIncome } from './use-sources-of-income'

describe('useSourcesOfIncome', () => {
  beforeEach(() => vi.restoreAllMocks())
  it('fetches /api/sources-of-income and returns parsed data', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: true, json: async () => ({ sources_of_income: {}, pagination: { page: 1, limit: 20, total: 0 } }) } as Response
    )
    const { result } = renderHook(() => useSourcesOfIncome(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchMock.mock.calls[0][0]).toContain('/api/sources-of-income')
    expect(result.current.data?.sources_of_income).toEqual({})
  })
})
