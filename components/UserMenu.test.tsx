import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const del = vi.hoisted(() => vi.fn())
const signOut = vi.hoisted(() => vi.fn())
const revokeBackendSession = vi.hoisted(() => vi.fn())
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { email: 'a@b.c' } } }),
  signOut,
}))
vi.mock('@/hooks/use-user', () => ({ useDeleteAccount: () => ({ mutate: del, isPending: false }) }))
vi.mock('@/app/actions/auth-actions', () => ({ revokeBackendSession }))
import { UserMenu } from './UserMenu'

describe('UserMenu', () => {
  it('shows the email and confirms before deleting the account', async () => {
    render(<UserMenu />)

    // Open the menu via the avatar trigger
    fireEvent.click(screen.getByRole('button'))
    expect(await screen.findByText('a@b.c')).toBeInTheDocument()

    // Delete is guarded behind a confirmation step
    fireEvent.click(screen.getByText(/delete account/i))
    expect(del).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(del).toHaveBeenCalled()
  })

  it('revokes the backend session then signs out client-side on log out', async () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(await screen.findByText(/log out/i))

    await waitFor(() => expect(revokeBackendSession).toHaveBeenCalled())
    await waitFor(() => expect(signOut).toHaveBeenCalledWith({ redirectTo: '/' }))
  })
})
