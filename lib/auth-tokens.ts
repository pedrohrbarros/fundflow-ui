const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export interface BackendTokens {
  accessToken: string
  refreshToken: string
  accessExpires: number
}

export interface BackendUser {
  id: number
  email: string
  country: string
}

const json = { 'Content-Type': 'application/json' }

export async function exchangeGoogleIdToken(idToken: string): Promise<{ tokens: BackendTokens; user: BackendUser }> {
  const res = await fetch(`${API_URL}/api/v1/auth/google`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ id_token: idToken }),
  })
  if (!res.ok) throw new Error('Google token exchange failed')
  const data = await res.json()
  return {
    tokens: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessExpires: Date.now() + data.access_expires_in * 1000,
    },
    user: data.user,
  }
}

export async function refreshBackendTokens(refreshToken: string): Promise<BackendTokens> {
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error('Refresh failed')
  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessExpires: Date.now() + data.access_expires_in * 1000,
  }
}

export async function logoutBackend(refreshToken: string): Promise<void> {
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}
