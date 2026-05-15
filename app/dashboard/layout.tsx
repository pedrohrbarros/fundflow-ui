import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
    </>
  )
}
