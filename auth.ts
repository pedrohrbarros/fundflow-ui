import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { exchangeGoogleIdToken, refreshBackendTokens } from '@/lib/auth-tokens'
import 'next-auth/jwt'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/' },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.id_token) {
        try {
          const { tokens, user } = await exchangeGoogleIdToken(account.id_token)
          token.accessToken = tokens.accessToken
          token.refreshToken = tokens.refreshToken
          token.accessExpires = tokens.accessExpires
          token.backendUser = user
          delete token.error
        } catch {
          token.error = 'GoogleExchangeError'
        }
        return token
      }
      if (typeof token.accessExpires === 'number' && Date.now() < token.accessExpires) {
        return token
      }
      const refreshToken = token.refreshToken
      if (!refreshToken) {
        token.error = 'RefreshAccessTokenError'
        return token
      }
      try {
        const tokens = await refreshBackendTokens(refreshToken)
        token.accessToken = tokens.accessToken
        token.refreshToken = tokens.refreshToken
        token.accessExpires = tokens.accessExpires
        delete token.error
      } catch {
        token.error = 'RefreshAccessTokenError'
      }
      return token
    },
    async session({ session, token }) {
      session.error = token.error
      if (token.backendUser) {
        session.user = {
          ...session.user,
          id: String(token.backendUser.id),
          email: token.backendUser.email,
        }
      }
      return session
    },
  },
})
