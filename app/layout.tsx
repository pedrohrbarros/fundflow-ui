import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { Geist } from 'next/font/google'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { Toaster } from 'sonner'
import '@/lib/suppress-warnings'
import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-family-sans' })

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
      <body className="antialiased">
        <ThemeProvider>
          <SessionProvider>
            <QueryProvider>
              {children}
              <Toaster richColors position="bottom-right" />
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
