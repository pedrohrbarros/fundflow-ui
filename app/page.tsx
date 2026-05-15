'use client'

import { useAuth, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { ThemeToggle } from '@/components/ThemeToggle'

function SignInSkeleton({ isDark }: { isDark: boolean }) {
  const cardBg = isDark ? '#000000' : '#ffffff'
  const pulse = isDark ? '#1f2937' : '#e5e7eb'

  return (
    <div className="w-100 rounded-2xl p-8 flex flex-col gap-4" style={{ backgroundColor: cardBg }}>
      <div className="h-10 w-full rounded-lg animate-pulse" style={{ backgroundColor: pulse }} />
      <div className="h-10 w-full rounded-lg animate-pulse" style={{ backgroundColor: pulse }} />
      <div className="h-10 w-full rounded-lg animate-pulse mt-1" style={{ backgroundColor: pulse }} />
      <div className="h-4 w-48 rounded-md animate-pulse mx-auto mt-2" style={{ backgroundColor: pulse }} />
    </div>
  )
}

export default function Home() {
  const { userId } = useAuth()
  const { loaded } = useClerk()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (userId) router.replace('/dashboard')
  }, [userId, router])

  if (userId) return null

  const isDark = !mounted || resolvedTheme === 'dark'

  return (
    <main className="flex h-screen relative">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle inverted disabled={!loaded} />
      </div>

      <div
        className="w-1/2 flex items-center justify-center"
        style={{ backgroundColor: isDark ? '#030712' : '#f0fdf4' }}
      >
        <Image src="/logo.png" alt="FundFlow" width={500} height={334} priority />
      </div>

      <div
        className="w-1/2 flex items-center justify-center"
        style={{ backgroundColor: isDark ? '#ffffff' : '#030712' }}
      >
        {!loaded ? (
          <SignInSkeleton isDark={isDark} />
        ) : (
          <SignIn
            routing="hash"
            appearance={{
              baseTheme: isDark ? dark : undefined,
              variables: {
                colorPrimary: '#16a34a',
                colorBackground: isDark ? '#000000' : '#ffffff',
                colorText: isDark ? '#ffffff' : '#000000',
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
