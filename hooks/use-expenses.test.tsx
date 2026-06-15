import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapper } from './test-utils'
import { useExpenses } from './use-expenses'

describe('useExpenses', () => {
  beforeEach(() => vi.restoreAllMocks())
  it('fetches /api/expenses and returns parsed data', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: true, json: async () => ({ expenses: [], pagination: { page: 1, limit: 20, total: 0 } }) } as Response
    )
    const { result } = renderHook(() => useExpenses(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchMock.mock.calls[0][0]).toContain('/api/expenses')
    expect(result.current.data?.expenses).toEqual([])
  })
})
