import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exchangeGoogleIdToken, refreshBackendTokens, logoutBackend } from './auth-tokens'

const okJson = (body: unknown) => ({ ok: true, json: async () => body }) as Response

describe('auth-tokens', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('exchanges a google id_token for backend tokens + user', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      okJson({ access_token: 'a', refresh_token: 'r', token_type: 'Bearer', access_expires_in: 900, user: { id: 1, email: 'x@y.z', country: 'BR' } })
    )
    const before = Date.now()
    const { tokens, user } = await exchangeGoogleIdToken('gid')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/google'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ id_token: 'gid' }) }),
    )
    expect(tokens.accessToken).toBe('a')
    expect(tokens.refreshToken).toBe('r')
    expect(tokens.accessExpires).toBeGreaterThanOrEqual(before + 900_000)
    expect(user).toEqual({ id: 1, email: 'x@y.z', country: 'BR' })
  })

  it('throws when exchange fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, json: async () => ({ error: 'Invalid Google token' }) } as Response)
    await expect(exchangeGoogleIdToken('bad')).rejects.toThrow()
  })

  it('rotates tokens on refresh', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      okJson({ access_token: 'a2', refresh_token: 'r2', token_type: 'Bearer', access_expires_in: 900 })
    )
    const t = await refreshBackendTokens('r1')
    expect(t).toMatchObject({ accessToken: 'a2', refreshToken: 'r2' })
  })

  it('posts the refresh token on logout', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response)
    await logoutBackend('r1')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/logout'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ refresh_token: 'r1' }) }),
    )
  })
})
