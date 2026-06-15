'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
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
  const { status } = useSession()
  const router = useRouter()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (status === 'authenticated') router.replace('/expenses')
  }, [status, router])

  if (status === 'authenticated') return null

  const is_dark = !resolvedTheme || resolvedTheme === 'dark'
  const theme = is_dark ? themes.dark : themes.light

  return (
    <main className="flex h-screen relative">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle inverted />
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
        {status === 'loading' ? (
          <SignInSkeleton is_dark={is_dark} />
        ) : (
          <div
            className="w-100 rounded-2xl p-8 flex flex-col items-center gap-6"
            style={{ backgroundColor: theme.container_color }}
          >
            <Image src="/logo.png" alt="FundFlow" width={160} height={40} priority style={{ height: 'auto' }} />
            <p className="text-sm text-center" style={{ color: theme.text_color }}>
              Sign in to track your monthly budget
            </p>
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => signIn('google', { redirectTo: '/expenses' })}
            >
              Continue with Google
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
