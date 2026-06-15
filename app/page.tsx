'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'
import { themes } from '@/constants/themes'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 6.9l7.1 5.5c4.1-3.8 6.5-9.4 6.5-16.9z" />
      <path fill="#FBBC05" d="M10.4 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.6l7.9-6.2z" />
      <path fill="#34A853" d="M24 48c6.4 0 11.9-2.1 15.8-5.8l-7.1-5.5c-2 1.3-4.5 2.1-8.7 2.1-6.3 0-11.7-3.7-13.6-9.9l-7.9 6.2C6.4 42.6 14.6 48 24 48z" />
    </svg>
  )
}

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
  const { data: session, status } = useSession()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const signedIn = status === 'authenticated' && !session?.error

  useEffect(() => {
    if (signedIn) router.replace('/expenses')
  }, [signedIn, router])

  if (signedIn) return null

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
            <button
              type="button"
              onClick={() => signIn('google', { redirectTo: '/expenses' })}
              className="w-full h-11 rounded-lg border border-green-200 dark:border-[#166534] bg-white dark:bg-[#1a2e1a] text-green-900 dark:text-[#d1fae5] font-medium flex items-center justify-center gap-3 hover:bg-green-50 dark:hover:bg-[#14532d] transition-colors"
            >
              <GoogleIcon /> Sign in with Google
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
