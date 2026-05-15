import type { Metadata } from 'next'
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { News_Cycle, Amiko, Rubik } from 'next/font/google'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { ThemeToggle } from '@/components/ThemeToggle'
import './globals.css'

const newsCycle = News_Cycle({
  weight: '700',
  variable: '--font-title',
  subsets: ['latin'],
})

const amiko = Amiko({
  weight: '600',
  variable: '--font-subtitle',
  subsets: ['latin'],
})

const rubik = Rubik({
  weight: '400',
  variable: '--font-body',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FundFlow',
  description: 'Monthly budget tracker',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${newsCycle.variable} ${amiko.variable} ${rubik.variable} antialiased`}>
        <ThemeProvider>
          <ClerkProvider>
            <QueryProvider>
              <header className="flex justify-end items-center p-4 gap-3 h-16 border-b border-green-100 dark:border-green-900 bg-white dark:bg-gray-950">
                <ThemeToggle />
                <Show when="signed-out">
                  <SignInButton />
                  <SignUpButton>
                    <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                      Sign Up
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </header>
              {children}
            </QueryProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
