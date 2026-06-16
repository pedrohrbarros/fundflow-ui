import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getAccessToken } = vi.hoisted(() => ({ getAccessToken: vi.fn() }))
vi.mock('@/lib/access-token', () => ({ getAccessToken, getRefreshToken: vi.fn() }))

import { apiRequest } from './api'

describe('apiRequest', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    getAccessToken.mockReset()
  })

  it('forwards a Bearer token and no X-Api-Key', async () => {
    getAccessToken.mockResolvedValue('tok123')
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: 1 }),
    } as Response)
    await apiRequest('/expenses/search', { method: 'POST', body: {} })
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok123')
    expect(headers['X-Api-Key']).toBeUndefined()
  })

  it('throws without calling the backend when there is no token', async () => {
    getAccessToken.mockResolvedValue(null)
    const fetchMock = vi.spyOn(global, 'fetch')
    await expect(apiRequest('/users/me')).rejects.toThrow(/unauthorized/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
