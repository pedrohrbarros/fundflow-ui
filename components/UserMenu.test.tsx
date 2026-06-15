import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const del = vi.hoisted(() => vi.fn())
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { email: 'a@b.c' } } }) }))
vi.mock('@/hooks/use-user', () => ({ useDeleteAccount: () => ({ mutate: del, isPending: false }) }))
vi.mock('@/app/actions/auth-actions', () => ({ logoutAction: vi.fn() }))
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
})
