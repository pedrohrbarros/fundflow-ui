'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { LogOut, Trash2 } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useDeleteAccount } from '@/hooks/use-user'
import { revokeBackendSession } from '@/app/actions/auth-actions'

export function UserMenu() {
  const { data: session } = useSession()
  const del = useDeleteAccount()
  const [confirming, setConfirming] = useState(false)
  const email = session?.user?.email ?? ''
  const initial = email.charAt(0).toUpperCase() || '?'

  async function handleLogout() {
    await revokeBackendSession()
    await signOut({ redirectTo: '/' })
  }

  return (
    <Popover>
      <PopoverTrigger className="size-9 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
        {session?.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt={email} className="size-9 rounded-full" />
        ) : (
          initial
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2 bg-white dark:bg-[#0f1a0f] border border-green-100 dark:border-[#166534]">
        <p className="px-2 py-1.5 text-sm text-green-900 dark:text-[#d1fae5] truncate">{email}</p>
        <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-green-700 dark:text-[#86efac] hover:bg-green-50 dark:hover:bg-[#1a2e1a] rounded">
          <LogOut className="size-4" /> Log out
        </button>
        {confirming ? (
          <div className="px-2 py-1.5">
            <p className="text-xs text-red-500 mb-1">Delete account and all data?</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={() => del.mutate()} disabled={del.isPending}>
                {del.isPending ? 'Deleting…' : 'Confirm'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded">
            <Trash2 className="size-4" /> Delete account
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
