import 'server-only'
import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { getToken } from 'next-auth/jwt'

export async function getAccessToken(): Promise<string | null> {
  const session = await auth()
  if (!session || session.error) return null
  return session.accessToken ?? null
}

// Used only during logout to revoke the backend session — getToken() is
// intentional here: we want the raw stored value, not a refreshed one.
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = await getToken({
    req: { headers: { cookie: cookieStore.toString() } } as never,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
    salt:
      process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
  })
  return token?.refreshToken ?? null
}
