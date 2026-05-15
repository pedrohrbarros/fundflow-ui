import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { LandingCTA } from './landing-cta'

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-green-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="flex items-center justify-center gap-3 text-4xl font-bold text-green-800 dark:text-green-400 mb-3">
          <Image src="/logo.png" alt="FundFlow logo" width={48} height={48} priority />
          FundFlow
        </h1>
        <p className="text-green-700 dark:text-green-500 text-lg mb-8">
          Track your income, expenses, and see exactly what you have left each month.
        </p>
        <LandingCTA />
      </div>
    </main>
  )
}
