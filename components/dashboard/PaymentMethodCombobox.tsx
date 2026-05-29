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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-full text-left border border-input bg-transparent hover:border-ring text-sm px-2 py-1.5 rounded outline-none transition-colors flex items-center justify-between gap-2 dark:border-white/[0.1] dark:bg-white/[0.04] dark:hover:border-green-700">
        <span className={selected ? 'text-foreground dark:text-green-100' : 'text-muted-foreground dark:text-white/30'}>
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
          className={`shrink-0 text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </PopoverTrigger>

      <PopoverContent align="start" side="bottom" className="p-0 w-64 dark:bg-gray-950 dark:border-green-900">
        <div className="max-h-52 overflow-y-auto">
          {paymentMethods.length === 0 && (
            <p className="text-muted-foreground text-xs italic px-3 py-3">No payment methods yet</p>
          )}
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer group transition-colors ${
                pm.id === value
                  ? 'bg-green-50 dark:bg-green-950'
                  : 'hover:bg-green-50/60 dark:hover:bg-green-950/60'
              }`}
              onClick={() => editingId !== pm.id && selectMethod(pm.id)}
            >
              {editingId === pm.id ? (
                <>
                  <Input
                    className="h-7 text-sm focus-visible:ring-0 min-w-0 flex-1"
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
                    className="shrink-0 bg-transparent border-0 text-green-600 hover:text-white hover:bg-green-600 dark:text-green-400 dark:hover:bg-green-800"
                    onClick={(e) => { e.stopPropagation(); saveEdit(pm.id) }}
                    disabled={updatePm.isPending}
                    title="Save"
                  >
                    ✓
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                    title="Cancel"
                  >
                    ✕
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground dark:text-green-100 truncate block">{pm.name}</span>
                    <span className="text-xs text-muted-foreground dark:text-green-700 truncate block">{pm.origin}</span>
                  </div>
                  {pm.id === value && (
                    <span className="shrink-0 text-green-600 dark:text-green-400 text-xs mr-0.5">✓</span>
                  )}
                  <button
                    onClick={(e) => startEdit(pm.id, pm.name, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-green-100 dark:hover:bg-green-900 text-xs px-1.5 py-0.5 rounded transition-all"
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

        <div className="border-t border-border dark:border-green-900">
          {showNew ? (
            <div className="flex flex-col gap-1.5 px-2 py-2">
              <Input
                className="h-7 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
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
                className="h-7 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
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
                  onClick={() => { setShowNew(false); setNewName(''); setNewOrigin('') }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowNew(true); setEditingId(null) }}
              className="w-full text-left text-xs text-green-600 dark:text-green-500 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/60 px-3 py-2 transition-colors"
            >
              + New payment method
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
