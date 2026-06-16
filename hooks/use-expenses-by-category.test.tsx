import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapper } from './test-utils'
import { useExpensesByCategory } from './use-expenses-by-category'

vi.mock('@/providers/period-provider', () => ({
  usePeriod: () => ({ granularity: 'monthly', date: '2026-06-15', setGranularity: () => {}, setDate: () => {}, next: () => {}, prev: () => {} }),
}))

describe('useExpensesByCategory', () => {
  beforeEach(() => vi.restoreAllMocks())
  it('fetches /api/expenses/by-category and returns parsed data', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: true, json: async () => ({ by_category: [], total: 0 }) } as Response
    )
    const { result } = renderHook(() => useExpensesByCategory(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchMock.mock.calls[0][0]).toContain('/api/expenses/by-category')
    expect(fetchMock.mock.calls[0][0]).toContain('granularity=monthly')
    expect(fetchMock.mock.calls[0][0]).toContain('date=2026-06-15')
    expect(result.current.data?.by_category).toEqual([])
  })
})
