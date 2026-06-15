import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { News_Cycle, Amiko, Rubik, Geist } from 'next/font/google'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { Toaster } from 'sonner'
import '@/lib/suppress-warnings'
import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-family-sans' })

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
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("dark font-sans", geist.variable)}>
      <body className={`${newsCycle.variable} ${amiko.variable} ${rubik.variable} antialiased`}>
        <ThemeProvider>
          <ClerkProvider>
            <QueryProvider>
              {children}
              <Toaster richColors position="bottom-right" />
            </QueryProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
