import type { BackendUser } from '@/lib/auth-tokens'

declare module 'next-auth' {
  interface Session {
    error?: string
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessExpires?: number
    backendUser?: BackendUser
    error?: string
  }
}
