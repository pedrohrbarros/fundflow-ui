'use client'

import { useState } from 'react'
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '@/hooks/use-payment-methods'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onChange: (paymentMethodId: string) => void
  placeholder?: string
  autoOpen?: boolean
  amount?: string
  onAmountChange?: (amount: string) => void
}

export function PaymentMethodCombobox({
  value,
  onChange,
  placeholder = 'Credit Card',
  autoOpen = false,
  amount,
  onAmountChange,
}: Props) {
  const { data } = usePaymentMethods()
  const createPm = useCreatePaymentMethod()
  const updatePm = useUpdatePaymentMethod()
  const deletePm = useDeletePaymentMethod()

  const paymentMethods = data?.payment_methods ?? []
  const selected = paymentMethods.find((pm) => String(pm.id) === value)

  const [open, setOpen] = useState(autoOpen)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editOrigin, setEditOrigin] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newOrigin, setNewOrigin] = useState('')
  const [pendingSelectId, setPendingSelectId] = useState<string | null>(null)
  const pending = paymentMethods.find((pm) => String(pm.id) === pendingSelectId)

  function selectMethod(id: string) {
    setEditingId(null)
    setShowNew(false)
    // When the parent tracks an amount, collect it in a confirm step before committing.
    if (onAmountChange) {
      setPendingSelectId(id)
      return
    }
    onChange(id)
    setOpen(false)
  }

  function confirmSelection() {
    if (!pendingSelectId) return
    onChange(pendingSelectId)
    setPendingSelectId(null)
    setOpen(false)
  }

  function cancelSelection() {
    setPendingSelectId(null)
  }

  function startEdit(id: string, name: string, origin: string, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(id)
    setEditName(name)
    setEditOrigin(origin)
    setShowNew(false)
  }

  function saveEdit(id: string) {
    if (!editName.trim()) return
    updatePm.mutate({ id, name: editName.trim(), origin: editOrigin.trim() }, {
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
        setShowNew(false)
        setNewName('')
        setNewOrigin('')
        // Same rule as selecting an existing method: collect the amount first.
        if (onAmountChange) {
          setPendingSelectId(String(pm.id))
          return
        }
        onChange(String(pm.id))
        setOpen(false)
      },
    })
  }

  return (
    <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full min-w-0 text-left bg-transparent dark:bg-[#1a2e1a] border border-green-100 dark:border-[#166534] hover:border-green-400 dark:hover:border-[#4ade80] text-[1rem] h-8 px-2.5 rounded outline-none transition-colors flex items-center justify-between gap-2"
    >
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
        className="shrink-0 text-green-500 dark:text-[#86efac]"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setPendingSelectId(null)
          setShowNew(false)
          setEditingId(null)
        }
      }}
    >
      <DialogContent className="w-[min(94vw,20rem)] bg-white dark:bg-[#0f1a0f] ring-green-700 dark:ring-[#166534] text-gray-900 dark:text-[#d1fae5] p-0 gap-0" showCloseButton={false}>
        <DialogTitle className="px-4 pt-4 pb-2">Select payment method</DialogTitle>
        {pendingSelectId ? (
          <div className="px-4 pb-4 flex flex-col gap-3">
            <div className="text-sm text-green-900 dark:text-[#d1fae5]">
              {pending?.name ?? pendingSelectId}
              {pending?.origin ? (
                <span className="text-green-500 dark:text-[#86efac]/60"> ({pending.origin})</span>
              ) : null}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-green-700 dark:text-[#86efac]">Amount</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={amount ?? ''}
                autoFocus
                onChange={(e) => onAmountChange?.(e.target.value.replace(',', '.'))}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmSelection() }}
                className="w-full text-left bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
              />
            </div>
            <div className="flex gap-1">
              <Button size="xs" className="flex-1" onClick={confirmSelection}>Add</Button>
              <Button
                size="xs"
                variant="ghost"
                className="text-green-400 dark:text-[#86efac]/60 hover:text-foreground dark:hover:text-white dark:hover:bg-[#1a2e1a]"
                onClick={cancelSelection}
              >
                Back
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-72 overflow-y-auto">
              {paymentMethods.length === 0 && (
                <p className="text-green-400 dark:text-[#86efac]/50 text-xs italic px-3 py-3">No payment methods yet</p>
              )}
              {paymentMethods.map((pm) => {
                const pmId = String(pm.id)
                return (
                <div
                  key={pmId}
                  className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer group transition-colors ${
                    pmId === value
                      ? 'bg-green-50 dark:bg-[#14532d]'
                      : 'hover:bg-green-50/60 dark:hover:bg-[#1a3a1a]'
                  }`}
                  onClick={() => editingId !== pmId && selectMethod(pmId)}
                >
                  {editingId === pmId ? (
                    <div className="flex flex-col gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <Input
                        className="h-7 text-sm focus-visible:ring-0 min-w-0 dark:bg-[#1a2e1a] dark:border-[#4ade80] dark:text-[#d1fae5]"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === 'Enter') saveEdit(pmId)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        placeholder="Name…"
                        autoFocus
                      />
                      <Input
                        className="h-7 text-sm focus-visible:ring-0 min-w-0 dark:bg-[#1a2e1a] dark:border-[#4ade80] dark:text-[#d1fae5] placeholder:text-green-300 dark:placeholder:text-[#86efac]/40"
                        value={editOrigin}
                        onChange={(e) => setEditOrigin(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === 'Enter') saveEdit(pmId)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        placeholder="Origin…"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="xs"
                          className="flex-1"
                          onClick={() => saveEdit(pmId)}
                          disabled={updatePm.isPending || !editName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-green-400 dark:text-[#86efac]/60 hover:text-foreground dark:hover:text-white dark:hover:bg-[#1a2e1a]"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-green-900 dark:text-[#d1fae5] truncate block">{pm.name}</span>
                        <span className="text-xs text-green-500 dark:text-[#86efac]/60 truncate block">{pm.origin}</span>
                      </div>
                      {pmId === value && (
                        <span className="shrink-0 text-green-600 dark:text-[#4ade80] text-xs mr-0.5">✓</span>
                      )}
                      <button
                        onClick={(e) => startEdit(pmId, pm.name, pm.origin, e)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-green-500 dark:text-[#86efac] hover:text-white hover:bg-green-600 dark:hover:bg-[#166534] text-xs px-1.5 py-0.5 rounded transition-all"
                        title="Rename"
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => handleDelete(pmId, e)}
                        disabled={deletePm.isPending}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-200 hover:bg-red-950/40 text-xs px-1.5 py-0.5 rounded transition-all"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
                )
              })}
            </div>

            <div className="border-t border-green-100 dark:border-[#166534]">
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
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
