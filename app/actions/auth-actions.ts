'use server'

import { signOut } from '@/auth'
import { getRefreshToken } from '@/lib/access-token'
import { logoutBackend } from '@/lib/auth-tokens'

export async function logoutAction() {
  const refreshToken = await getRefreshToken()
  if (refreshToken) {
    try {
      await logoutBackend(refreshToken)
    } catch {
      // best-effort backend revoke; always proceed to local sign-out
    }
  }
  await signOut({ redirectTo: '/' })
}
