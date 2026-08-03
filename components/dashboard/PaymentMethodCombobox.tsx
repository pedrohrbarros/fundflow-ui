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
}

export function PaymentMethodCombobox({
  value,
  onChange,
  placeholder = 'Credit Card',
  autoOpen = false,
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

  function selectMethod(id: string) {
    setEditingId(null)
    setShowNew(false)
    onChange(id)
    setOpen(false)
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
    updatePm.mutate(
      { id, name: editName.trim(), origin: editOrigin.trim() },
      { onSuccess: () => setEditingId(null) }
    )
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (id === value) onChange('')
    deletePm.mutate(id)
  }

  function handleCreate() {
    if (!newName.trim() || !newOrigin.trim()) return
    createPm.mutate(
      { name: newName.trim(), origin: newOrigin.trim() },
      {
        onSuccess: (pm) => {
          setShowNew(false)
          setNewName('')
          setNewOrigin('')
          onChange(String(pm.id))
          setOpen(false)
        },
      }
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-w-0 text-left bg-transparent border border-input hover:border-ring text-[1rem] h-8 px-2.5 rounded outline-none transition-colors flex items-center justify-between gap-2"
      >
        <span className={`truncate ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
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
          className="shrink-0 text-muted-foreground"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) {
            setShowNew(false)
            setEditingId(null)
          }
        }}
      >
        <DialogContent className="w-[min(94vw,20rem)] p-0 gap-0" showCloseButton={false}>
          <DialogTitle className="px-4 pt-4 pb-2">Select payment method</DialogTitle>

          <div className="max-h-72 overflow-y-auto">
            {paymentMethods.length === 0 && (
              <p className="text-muted-foreground text-xs italic px-3 py-3">
                No payment methods yet
              </p>
            )}
            {/* An expense may have no payment method, so selecting one has to be undoable. */}
            {value && (
              <div
                className="flex items-center px-2 py-1.5 cursor-pointer transition-colors hover:bg-accent/60"
                onClick={() => selectMethod('')}
              >
                <span className="text-sm text-muted-foreground">No payment method</span>
              </div>
            )}
            {paymentMethods.map((pm) => {
              const pmId = String(pm.id)
              return (
                <div
                  key={pmId}
                  className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer group transition-colors ${
                    pmId === value ? 'bg-accent' : 'hover:bg-accent/60'
                  }`}
                  onClick={() => editingId !== pmId && selectMethod(pmId)}
                >
                  {editingId === pmId ? (
                    <div
                      className="flex flex-col gap-1 flex-1 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        className="h-7 text-sm focus-visible:ring-0 min-w-0"
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
                        className="h-7 text-sm focus-visible:ring-0 min-w-0"
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
                          className="text-muted-foreground hover:text-foreground hover:bg-accent"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground truncate block">{pm.name}</span>
                        <span className="text-xs text-muted-foreground truncate block">
                          {pm.origin}
                        </span>
                      </div>
                      {pmId === value && (
                        <span className="shrink-0 text-primary text-xs mr-0.5">✓</span>
                      )}
                      <button
                        onClick={(e) => startEdit(pmId, pm.name, pm.origin, e)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary-foreground hover:bg-primary text-xs px-1.5 py-0.5 rounded transition-all"
                        title="Rename"
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => handleDelete(pmId, e)}
                        disabled={deletePm.isPending}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/20 text-xs px-1.5 py-0.5 rounded transition-all"
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

          <div className="border-t border-border">
            {showNew ? (
              <div className="flex flex-col gap-1.5 px-2 py-2">
                <Input
                  className="h-7 text-sm focus-visible:ring-0"
                  placeholder="Name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Escape') {
                      setShowNew(false)
                      setNewName('')
                      setNewOrigin('')
                    }
                  }}
                  autoFocus
                />
                <Input
                  className="h-7 text-sm focus-visible:ring-0"
                  placeholder="Origin (e.g. Bank, Wallet)…"
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') handleCreate()
                    if (e.key === 'Escape') {
                      setShowNew(false)
                      setNewName('')
                      setNewOrigin('')
                    }
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
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={() => {
                      setShowNew(false)
                      setNewName('')
                      setNewOrigin('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowNew(true)
                  setEditingId(null)
                }}
                className="w-full text-left text-xs text-primary hover:text-foreground hover:bg-accent px-3 py-2 transition-colors"
              >
                + New payment method
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
