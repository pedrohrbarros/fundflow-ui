'use client'

import { useAuth, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { ThemeToggle } from '@/components/ThemeToggle'
import { themes } from '@/constants/themes'

function SignInSkeleton({ is_dark }: { is_dark: boolean }) {
  const theme = is_dark ? themes.dark : themes.light
  const pulse = is_dark ? '#1f2937' : '#d1fae5'

  return (
    <div className="w-100 rounded-2xl p-8 flex flex-col gap-4" style={{ backgroundColor: theme.container_color }}>
      <div className="h-10 w-full rounded-lg animate-pulse" style={{ backgroundColor: pulse }} />
      <div className="h-10 w-full rounded-lg animate-pulse" style={{ backgroundColor: pulse }} />
      <div className="h-10 w-full rounded-lg animate-pulse mt-1" style={{ backgroundColor: pulse }} />
      <div className="h-4 w-48 rounded-md animate-pulse mx-auto mt-2" style={{ backgroundColor: pulse }} />
    </div>
  )
}

export default function Home() {
  const { userId, isLoaded } = useAuth()
  const { loaded } = useClerk()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [is_desktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setMounted(true)
    const media_query = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(media_query.matches)

    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
    }

    if (typeof media_query.addEventListener === 'function') {
      media_query.addEventListener('change', handler)
      return () => {
        media_query.removeEventListener('change', handler)
      }
    }

    if (typeof media_query.addListener === 'function') {
      media_query.addListener(handler)
      return () => {
        media_query.removeListener(handler)
      }
    }

    return
  }, [])

  useEffect(() => {
    if (userId) router.replace('/expenses')
  }, [userId, router])

  if (userId) return null

  const is_dark = !mounted || resolvedTheme === 'dark'
  const theme = is_dark ? themes.dark : themes.light

  return (
    <main className="flex h-screen relative">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle inverted disabled={!loaded} />
      </div>

      <div
        className="hidden lg:flex w-1/2 items-center justify-center"
        style={{ backgroundColor: theme.background_color }}
      >
        <Image src="/logo.png" alt="FundFlow" width={500} height={334} priority style={{ width: '100%', maxWidth: '350px', height: 'auto' }} />
      </div>

      <div
        className="w-full lg:w-1/2 flex items-center justify-center"
        style={{ backgroundColor: theme.background_color_switched }}
      >
        {!loaded || !isLoaded ? (
          <SignInSkeleton is_dark={is_dark} />
        ) : (
          <SignIn
            routing="hash"
            appearance={{
              baseTheme: is_dark ? dark : undefined,
              variables: {
                colorPrimary: themes.brand.primary,
                colorBackground: theme.container_color,
                colorText: theme.text_color,
              },
              elements: {
                rootBox: { backgroundColor: 'transparent' },
                logoImage: { height: '40px', width: 'auto' },
                ...(is_desktop ? {
                  logoBox: { display: 'none' },
                  headerSubtitle: { display: 'none' },
                } : {
                  headerTitle: { display: 'none' },
                }),
              },
            }}
          />
        )}
      </div>
    </main>
  )
}
