import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { Geist } from 'next/font/google'
import { QueryProvider } from '@/providers/query-provider'
import { Toaster } from 'sonner'
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
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body className="antialiased">
        <SessionProvider>
          <QueryProvider>
            {children}
            <Toaster theme="dark" richColors position="bottom-right" />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
