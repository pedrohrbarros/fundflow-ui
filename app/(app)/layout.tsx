import Image from 'next/image'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CountryPicker } from '@/components/dashboard/CountryPicker'
import { Sidebar } from '@/components/Sidebar'
import { UserMenu } from '@/components/UserMenu'
import { PeriodSelector } from '@/components/PeriodSelector'
import { PeriodProvider } from '@/providers/period-provider'
import { SidebarToggle } from '@/components/SidebarToggle'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.error) redirect('/')

  return (
    <PeriodProvider>
      <div className="h-screen flex flex-col">
        <header className="flex flex-col border-b border-green-100 dark:border-green-900 bg-white dark:bg-gray-950 shrink-0">
          <div className="flex justify-between items-center p-4 gap-3 h-16">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <SidebarToggle />
              <Image src="/logo.png" alt="FundFlow" width={120} height={32} priority style={{ height: 'auto' }} className="hidden sm:block" />
            </div>
            <div className="hidden sm:block">
              <PeriodSelector />
            </div>
          </div>
          <div className="flex flex-col sm:hidden gap-3 items-center pb-4">
            <PeriodSelector />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <CountryPicker />
              <UserMenu />
            </div>
          </div>
          <div className="hidden sm:flex justify-between items-center px-4 pb-4">
            <div />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <CountryPicker />
              <UserMenu />
            </div>
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
