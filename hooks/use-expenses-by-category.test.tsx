import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapper } from './test-utils'
import { useExpensesByCategory } from './use-expenses-by-category'

describe('useExpensesByCategory', () => {
  beforeEach(() => vi.restoreAllMocks())
  it('fetches /api/expenses/by-category and returns parsed data', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: true, json: async () => ({ by_category: [], total: 0 }) } as Response
    )
    const { result } = renderHook(() => useExpensesByCategory(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchMock.mock.calls[0][0]).toContain('/api/expenses/by-category')
    expect(result.current.data?.by_category).toEqual([])
  })
})
