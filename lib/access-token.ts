import 'server-only'
import { cookies } from 'next/headers'
import { getToken } from 'next-auth/jwt'

async function readToken() {
  const cookieStore = await cookies()
  return getToken({
    req: { headers: { cookie: cookieStore.toString() } } as never,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
    salt:
      process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
  })
}

export async function getAccessToken(): Promise<string | null> {
  const token = await readToken()
  if (!token || token.error) return null
  return token.accessToken ?? null
}

export async function getRefreshToken(): Promise<string | null> {
  const token = await readToken()
  return token?.refreshToken ?? null
}
