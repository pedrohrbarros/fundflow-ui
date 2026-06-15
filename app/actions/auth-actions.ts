'use server'

import { getRefreshToken } from '@/lib/access-token'
import { logoutBackend } from '@/lib/auth-tokens'

// Revoke the backend refresh token server-side (reads the httpOnly session cookie).
// The actual NextAuth sign-out is done client-side (next-auth/react `signOut`) so the
// SessionProvider updates immediately — otherwise the client keeps a stale session and
// the post-logout page renders blank until a manual reload.
export async function revokeBackendSession() {
  const refreshToken = await getRefreshToken()
  if (refreshToken) {
    try {
      await logoutBackend(refreshToken)
    } catch {
      // best-effort backend revoke; always proceed to client sign-out
    }
  }
}
