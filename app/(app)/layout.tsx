import Image from 'next/image'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CountryPicker } from '@/components/dashboard/CountryPicker'
import { Sidebar } from '@/components/Sidebar'
import { UserMenu } from '@/components/UserMenu'
import { PeriodSelector } from '@/components/PeriodSelector'
import { PeriodProvider } from '@/providers/period-provider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.error) redirect('/')

  return (
    <PeriodProvider>
      <div className="h-screen flex flex-col">
        <header className="flex justify-between items-center p-4 gap-3 h-16 border-b border-green-100 dark:border-green-900 bg-white dark:bg-gray-950 shrink-0">
          <Image src="/logo.png" alt="FundFlow" width={120} height={32} priority style={{ height: 'auto' }} />
          <PeriodSelector />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <CountryPicker />
            <UserMenu />
          </div>
        </header>
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
        </div>
      </div>
    </PeriodProvider>
  )
}
