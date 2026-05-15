'use client'

import { SignInButton, SignUpButton } from '@clerk/nextjs'

export function LandingCTA() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <SignUpButton>
        <button className="btn-green px-6 py-3 text-base rounded-lg">
          Get started — it's free
        </button>
      </SignUpButton>
      <SignInButton>
        <button className="btn-ghost px-6 py-3 text-base rounded-lg">
          Sign in
        </button>
      </SignInButton>
    </div>
  )
}
