'use client'

import { useAuth, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { ThemeToggle } from '@/components/ThemeToggle'
import { colors } from '@/constants/colors'

function SignInSkeleton({ is_dark }: { is_dark: boolean }) {
  const theme = is_dark ? colors.dark : colors.light

  return (
    <div className="w-100 rounded-2xl p-8 flex flex-col gap-4" style={{ backgroundColor: theme.card_bg }}>
      <div className="h-10 w-full rounded-lg animate-pulse" style={{ backgroundColor: theme.pulse }} />
      <div className="h-10 w-full rounded-lg animate-pulse" style={{ backgroundColor: theme.pulse }} />
      <div className="h-10 w-full rounded-lg animate-pulse mt-1" style={{ backgroundColor: theme.pulse }} />
      <div className="h-4 w-48 rounded-md animate-pulse mx-auto mt-2" style={{ backgroundColor: theme.pulse }} />
    </div>
  )
}

export default function Home() {
  const { userId, isLoaded } = useAuth()
  const { loaded } = useClerk()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (userId) router.replace('/dashboard')
  }, [userId, router])

  if (userId) return null

  const is_dark = !mounted || resolvedTheme === 'dark'
  const theme = is_dark ? colors.dark : colors.light

  return (
    <main className="flex h-screen relative">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle inverted disabled={!loaded} />
      </div>

      <div
        className="w-1/2 flex items-center justify-center"
        style={{ backgroundColor: theme.page_bg }}
      >
        <Image src="/logo.png" alt="FundFlow" width={500} height={334} priority style={{ height: 'auto' }} />
      </div>

      <div
        className="w-1/2 flex items-center justify-center"
        style={{ backgroundColor: theme.auth_col_bg }}
      >
        {!loaded || !isLoaded ? (
          <SignInSkeleton is_dark={is_dark} />
        ) : (
          <SignIn
            routing="hash"
            appearance={{
              baseTheme: is_dark ? dark : undefined,
              variables: {
                colorPrimary: colors.brand.primary,
                colorBackground: theme.color_background,
                colorText: theme.color_text,
              },
              elements: {
                header: { display: 'none' },
              },
            }}
          />
        )}
      </div>
    </main>
  )
}
