import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWrapper } from './test-utils'
import { useCurrentUser, useUpdateUserCountry } from './use-user'

vi.mock('next-auth/react', () => ({ signOut: vi.fn() }))

describe('useCurrentUser', () => {
  beforeEach(() => vi.restoreAllMocks())
  it('fetches /api/users/me and returns parsed data', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: true, json: async () => ({ id: '1', email: 'a@b.c', country: 'BR', created_at: '', updated_at: '' }) } as Response
    )
    const { result } = renderHook(() => useCurrentUser(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchMock.mock.calls[0][0]).toContain('/api/users/me')
    expect(result.current.data?.country).toBe('BR')
  })
})

describe('useUpdateUserCountry', () => {
  beforeEach(() => vi.restoreAllMocks())
  it('PATCHes /api/users/me with the new country', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: true, json: async () => ({ id: '1', email: 'a@b.c', country: 'US', created_at: '', updated_at: '' }) } as Response
    )
    const { result } = renderHook(() => useUpdateUserCountry(), { wrapper: createWrapper() })
    result.current.mutate({ country: 'US' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchMock.mock.calls[0][0]).toContain('/api/users/me')
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ country: 'US' }) })
    )
  })
})
