import Image from 'next/image'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { CountryPicker } from '@/components/dashboard/CountryPicker'
import { Sidebar } from '@/components/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/')

  return (
    <div className="h-screen flex flex-col">
      <header className="flex justify-between items-center p-4 gap-3 h-16 border-b border-green-100 dark:border-green-900 bg-white dark:bg-gray-950 shrink-0">
        <Image src="/logo.png" alt="FundFlow" width={120} height={32} priority style={{ height: 'auto' }} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton>
              <Button
                className="bg-[#6c47ff] hover:bg-[#5a3adb] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                size="default"
              >
                Sign Up
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <CountryPicker />
            <UserButton />
          </Show>
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
