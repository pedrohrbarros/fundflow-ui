import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn,
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'dark' }) }))

import Home from './page'

describe('sign-in page', () => {
  it('starts Google sign-in on click', () => {
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }))
    expect(signIn).toHaveBeenCalledWith('google', { redirectTo: '/expenses' })
  })
})
