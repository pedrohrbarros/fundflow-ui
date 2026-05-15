import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { News_Cycle, Amiko, Rubik } from 'next/font/google'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import '@/lib/suppress-warnings'
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
              {children}
            </QueryProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
