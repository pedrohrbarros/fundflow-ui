import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapper } from './test-utils'
import { useCategories } from './use-categories'

describe('useCategories', () => {
  beforeEach(() => vi.restoreAllMocks())
  it('fetches /api/categories and returns parsed data', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: true, json: async () => ({ categories: [] }) } as Response
    )
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchMock.mock.calls[0][0]).toContain('/api/categories')
    expect(result.current.data?.categories).toEqual([])
  })
})
