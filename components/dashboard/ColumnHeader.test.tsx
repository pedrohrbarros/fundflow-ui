import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ColumnHeader } from './ColumnHeader'

describe('ColumnHeader', () => {
  it('cycles sort when the sortable label is clicked', () => {
    const onSort = vi.fn()
    render(<ColumnHeader label="Name" sortKey="name" sort={null} onSort={onSort} />)
    fireEvent.click(screen.getByText('Name'))
    expect(onSort).toHaveBeenCalledWith('name')
  })

  it('applies a text filter', async () => {
    const onChange = vi.fn()
    render(<ColumnHeader label="Name" filter={{ field: 'name', type: 'text', value: null, onChange }} />)
    fireEvent.click(screen.getByRole('button', { name: /filter name/i }))
    fireEvent.change(await screen.findByPlaceholderText('Value…'), { target: { value: 'rent' } })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(onChange).toHaveBeenCalledWith({ field: 'name', op: 'is_contains', value: 'rent' })
  })

  it('clears a filter', async () => {
    const onChange = vi.fn()
    render(<ColumnHeader label="Name" filter={{ field: 'name', type: 'text', value: { field: 'name', op: 'is_contains', value: 'x' }, onChange }} />)
    fireEvent.click(screen.getByRole('button', { name: /filter name/i }))
    fireEvent.click(await screen.findByRole('button', { name: /clear/i }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
