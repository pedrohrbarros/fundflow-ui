'use client'

import { useState } from 'react'
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '@/hooks/use-payment-methods'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onChange: (paymentMethodId: string) => void
  placeholder?: string
}

export function PaymentMethodCombobox({ value, onChange, placeholder = 'Credit Card' }: Props) {
  const { data } = usePaymentMethods()
  const createPm = useCreatePaymentMethod()
  const updatePm = useUpdatePaymentMethod()
  const deletePm = useDeletePaymentMethod()

  const paymentMethods = data?.payment_methods ?? []
  const selected = paymentMethods.find((pm) => pm.id === value)

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newOrigin, setNewOrigin] = useState('')

  function selectMethod(id: string) {
    onChange(id)
    setOpen(false)
    setEditingId(null)
    setShowNew(false)
  }

  function startEdit(id: string, name: string, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(id)
    setEditName(name)
    setShowNew(false)
  }

  function saveEdit(id: string) {
    if (!editName.trim()) return
    updatePm.mutate({ id, name: editName.trim() }, {
      onSuccess: () => setEditingId(null),
    })
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (id === value) onChange('')
    deletePm.mutate(id)
  }

  function handleCreate() {
    if (!newName.trim() || !newOrigin.trim()) return
    createPm.mutate({ name: newName.trim(), origin: newOrigin.trim() }, {
      onSuccess: (pm) => {
        onChange(pm.id)
        setShowNew(false)
        setNewName('')
        setNewOrigin('')
        setOpen(false)
      },
    })
  }

  return (
    <Popover className="w-full" open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-full min-w-0 text-left bg-transparent dark:bg-[#1a2e1a] border border-green-200 dark:border-[#166534] hover:border-green-400 dark:hover:border-[#4ade80] text-[1rem] h-8 px-2.5 rounded outline-none transition-colors flex items-center justify-between gap-2">
        <span className={selected ? 'text-green-900 dark:text-[#d1fae5]' : 'text-green-400/70 dark:text-[#86efac]/50'}>
          {selected?.name ?? placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-green-500 dark:text-[#86efac] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </PopoverTrigger>

      <PopoverContent align="start" side="bottom" className="bg-white dark:bg-[#0f1a0f] border border-green-200 dark:border-[#166534] p-0 w-64">
        <div className="max-h-52 overflow-y-auto">
          {paymentMethods.length === 0 && (
            <p className="text-green-400 dark:text-[#86efac]/50 text-xs italic px-3 py-3">No payment methods yet</p>
          )}
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer group transition-colors ${
                pm.id === value
                  ? 'bg-green-50 dark:bg-[#14532d]'
                  : 'hover:bg-green-50/60 dark:hover:bg-[#1a3a1a]'
              }`}
              onClick={() => editingId !== pm.id && selectMethod(pm.id)}
            >
              {editingId === pm.id ? (
                <>
                  <Input
                    className="h-7 text-sm focus-visible:ring-0 min-w-0 flex-1 dark:bg-[#1a2e1a] dark:border-[#4ade80] dark:text-[#d1fae5]"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') saveEdit(pm.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  <Button
                    size="icon-xs"
                    className="shrink-0 bg-transparent border-0 text-green-600 dark:text-[#4ade80] hover:text-white hover:bg-green-600 dark:hover:bg-[#166534]"
                    onClick={(e) => { e.stopPropagation(); saveEdit(pm.id) }}
                    disabled={updatePm.isPending}
                    title="Save"
                  >
                    ✓
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="shrink-0 text-green-400 dark:text-[#86efac]/60 hover:text-foreground dark:hover:text-white dark:hover:bg-[#1a2e1a]"
                    onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                    title="Cancel"
                  >
                    ✕
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-green-900 dark:text-[#d1fae5] truncate block">{pm.name}</span>
                    <span className="text-xs text-green-500 dark:text-[#86efac]/60 truncate block">{pm.origin}</span>
                  </div>
                  {pm.id === value && (
                    <span className="shrink-0 text-green-600 dark:text-[#4ade80] text-xs mr-0.5">✓</span>
                  )}
                  <button
                    onClick={(e) => startEdit(pm.id, pm.name, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-green-500 dark:text-[#86efac] hover:text-white hover:bg-green-600 dark:hover:bg-[#166534] text-xs px-1.5 py-0.5 rounded transition-all"
                    title="Rename"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => handleDelete(pm.id, e)}
                    disabled={deletePm.isPending}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-200 hover:bg-red-950/40 text-xs px-1.5 py-0.5 rounded transition-all"
                    title="Delete"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-green-200 dark:border-[#166534]">
          {showNew ? (
            <div className="flex flex-col gap-1.5 px-2 py-2">
              <Input
                className="h-7 text-sm focus-visible:ring-0 dark:bg-[#1a2e1a] dark:border-[#4ade80] dark:text-[#d1fae5] placeholder:text-green-300 dark:placeholder:text-[#86efac]/40"
                placeholder="Name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Escape') { setShowNew(false); setNewName(''); setNewOrigin('') }
                }}
                autoFocus
              />
              <Input
                className="h-7 text-sm focus-visible:ring-0 dark:bg-[#1a2e1a] dark:border-[#4ade80] dark:text-[#d1fae5] placeholder:text-green-300 dark:placeholder:text-[#86efac]/40"
                placeholder="Origin (e.g. Bank, Wallet)…"
                value={newOrigin}
                onChange={(e) => setNewOrigin(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') { setShowNew(false); setNewName(''); setNewOrigin('') }
                }}
              />
              <div className="flex gap-1">
                <Button
                  size="xs"
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={createPm.isPending || !newName.trim() || !newOrigin.trim()}
                >
                  Add
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-green-400 dark:text-[#86efac]/60 hover:text-foreground dark:hover:text-white dark:hover:bg-[#1a2e1a]"
                  onClick={() => { setShowNew(false); setNewName(''); setNewOrigin('') }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowNew(true); setEditingId(null) }}
              className="w-full text-left text-xs text-green-600 dark:text-[#86efac] hover:text-green-900 dark:hover:text-white hover:bg-green-50 dark:hover:bg-[#1a3a1a] px-3 py-2 transition-colors"
            >
              + New payment method
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
