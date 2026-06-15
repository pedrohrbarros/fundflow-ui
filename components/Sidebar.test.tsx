import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ usePathname: () => '/expenses' }))
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  it('marks the active route', () => {
    render(<Sidebar />)
    const expenses = screen.getByRole('link', { name: /expenses/i })
    expect(expenses.className).toMatch(/bg-green-100|#14532d/)
  })
})
