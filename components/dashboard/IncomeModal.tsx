'use client'

import { useEffect, useState } from 'react'
import {
  useSourcesOfIncome,
  useCreateSourceOfIncome,
  useUpdateSourceOfIncome,
  useDeleteSourceOfIncome,
} from '@/hooks/use-sources-of-income'
import { fmtMoney } from '@/lib/format'
import { CategoryCombobox } from './CategoryCombobox'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Props {
  open: boolean
  onClose: () => void
}

interface RowForm {
  name: string
  category_id: string
  income: string
  currency: string
}

const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'BRL', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN', 'KRW', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'NZD', 'ZAR', 'RUB'] as const

const emptyForm: RowForm = { name: '', category_id: '', income: '', currency: 'USD' }

export function IncomeModal({ open, onClose }: Props) {
  const { data, isLoading } = useSourcesOfIncome()
  const create = useCreateSourceOfIncome()
  const update = useUpdateSourceOfIncome()
  const deleteSource = useDeleteSourceOfIncome()

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<RowForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<RowForm>(emptyForm)

  const sources = data ? Object.values(data.sources_of_income).flat() : []
  const total = sources.reduce((sum, s) => sum + s.income, 0)
  const distinctCurrencies = new Set(sources.map((source) => source.currency ?? 'USD'))
  const totalCurrency = distinctCurrencies.size === 1 ? distinctCurrencies.values().next().value : null

  useEffect(() => {
    if (!open) {
      setIsAdding(false)
      setAddForm(emptyForm)
      setEditingId(null)
      setEditForm(emptyForm)
    }
  }, [open])

  function handleAdd() {
    if (!addForm.name.trim() || !addForm.category_id) return
    create.mutate(
      {
        name: addForm.name.trim(),
        category_id: parseInt(addForm.category_id, 10),
        income: parseFloat(addForm.income) || 0,
        currency: addForm.currency || 'USD',
      },
      {
        onSuccess: () => {
          setAddForm(emptyForm)
          setIsAdding(false)
        },
      }
    )
  }

  function startEdit(id: string) {
    const source = sources.find((s) => s.id === id)
    if (!source) return
    setEditingId(id)
    setEditForm({
      name: source.name,
      category_id: source.category_id,
      income: String(source.income),
      currency: source.currency ?? 'USD',
    })
  }

  function handleUpdate(id: string) {
    if (!editForm.name.trim() || !editForm.category_id) return
    update.mutate(
      {
        id,
        name: editForm.name.trim(),
        category_id: parseInt(editForm.category_id, 10),
        income: parseFloat(editForm.income) || 0,
        currency: editForm.currency || 'USD',
      },
      {
        onSuccess: () => {
          setEditingId(null)
          setEditForm(emptyForm)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent
        className="income-modal-dark sm:max-w-2xl max-h-[80vh] flex flex-col p-0 bg-[#0f1a0f] ring-[#166534] gap-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between px-5 py-3 bg-[#166534] rounded-t-xl shrink-0 gap-0">
          <DialogTitle className="text-sm font-bold text-white uppercase tracking-widest">
            Income Sources
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button size="xs" onClick={() => setIsAdding(true)} aria-label="Add income">
              + Add Income
            </Button>
            <DialogClose className="text-[#86efac] hover:text-white hover:bg-[#14532d] rounded px-2 py-1 text-base leading-none transition-colors">
              ✕
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Scrollable table area */}
        <div className="overflow-auto flex-1">
          <Table className="sheet-table">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="py-2 px-3 h-auto">Name</TableHead>
                <TableHead className="py-2 px-3 h-auto">Category</TableHead>
                <TableHead className="py-2 px-3 h-auto w-32 text-right">Amount</TableHead>
                <TableHead className="py-2 px-3 h-auto w-24">Currency</TableHead>
                <TableHead className="py-2 px-3 h-auto w-36">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow className="border-0">
                  <TableCell colSpan={5} className="py-6 px-3 text-center text-[#86efac]">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {sources.map((source) => (
                <TableRow key={source.id} className="border-0">
                  <TableCell className="py-2.5 px-3">
                    {editingId === source.id ? (
                      <Input
                        className="h-7 text-sm min-w-0"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, name: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(source.id)
                          if (e.key === 'Escape') { e.stopPropagation(); setEditingId(null); setEditForm(emptyForm) }
                        }}
                        autoFocus
                      />
                    ) : (
                      source.name
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 px-3">
                    {editingId === source.id ? (
                      <CategoryCombobox
                        value={editForm.category_id}
                        onChange={(id) =>
                          setEditForm((f) => ({ ...f, category_id: id }))
                        }
                      />
                    ) : (
                      source.category_id
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-right amount-col">
                    {editingId === source.id ? (
                      <Input
                        className="h-7 text-sm min-w-0 text-right"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.income}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, income: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(source.id)
                          if (e.key === 'Escape') { e.stopPropagation(); setEditingId(null); setEditForm(emptyForm) }
                        }}
                      />
                    ) : (
                      <span className="font-mono">{fmtMoney(source.income)}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 px-3">
                    {editingId === source.id ? (
                      <select
                        className="h-7 text-sm bg-[#1a2e1a] border border-[#166534] text-[#d1fae5] rounded px-1 w-20"
                        value={editForm.currency}
                        onChange={(e) => setEditForm((f) => ({ ...f, currency: e.target.value }))}
                      >
                        {COMMON_CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-mono text-[#86efac]">{source.currency ?? 'USD'}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 px-3">
                    <div className="flex gap-2">
                      {editingId === source.id ? (
                        <>
                          <Button
                            size="xs"
                            onClick={() => handleUpdate(source.id)}
                            disabled={update.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-[#4ade80] hover:bg-[#1a2e1a]"
                            onClick={() => { setEditingId(null); setEditForm(emptyForm) }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="xs"
                            className="border-[#166534] text-[#86efac] hover:bg-[#1a2e1a]"
                            onClick={() => startEdit(source.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="xs"
                            onClick={() => deleteSource.mutate(source.id)}
                            disabled={deleteSource.isPending}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {isAdding && (
                <TableRow className="add-row border-0">
                  <TableCell className="py-2.5 px-3">
                    <Input
                      className="h-7 text-sm min-w-0"
                      placeholder="Source name"
                      value={addForm.name}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, name: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd()
                        if (e.key === 'Escape') {
                          e.stopPropagation()
                          setIsAdding(false)
                          setAddForm(emptyForm)
                        }
                      }}
                      autoFocus
                    />
                  </TableCell>
                  <TableCell className="py-2.5 px-3">
                    <CategoryCombobox
                      value={addForm.category_id}
                      onChange={(id) =>
                        setAddForm((f) => ({ ...f, category_id: id }))
                      }
                    />
                  </TableCell>
                  <TableCell className="py-2.5 px-3 amount-col">
                    <Input
                      className="h-7 text-sm min-w-0 text-right"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={addForm.income}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, income: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd()
                        if (e.key === 'Escape') {
                          e.stopPropagation()
                          setIsAdding(false)
                          setAddForm(emptyForm)
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="py-2.5 px-3">
                    <select
                      className="h-7 text-sm bg-[#1a2e1a] border border-[#166534] text-[#d1fae5] rounded px-1 w-20"
                      value={addForm.currency}
                      onChange={(e) => setAddForm((f) => ({ ...f, currency: e.target.value }))}
                    >
                      {COMMON_CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="py-2.5 px-3">
                    <div className="flex gap-2">
                      <Button size="xs" onClick={handleAdd} disabled={create.isPending}>
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-[#4ade80] hover:bg-[#1a2e1a]"
                        onClick={() => {
                          setIsAdding(false)
                          setAddForm(emptyForm)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {sources.length > 0 && (
                <TableRow className="total-row border-0">
                  <TableCell colSpan={2} className="py-2.5 px-3 font-semibold">
                    {totalCurrency ? 'TOTAL' : 'TOTAL (RAW, MIXED CURRENCIES)'}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-right font-mono font-semibold amount-col">
                    {totalCurrency ? fmtMoney(total, totalCurrency) : total.toFixed(2)}
                  </TableCell>
                  <TableCell colSpan={2} className="py-2.5 px-3" />
                </TableRow>
              )}
              {!isLoading && !sources.length && !isAdding && (
                <TableRow className="border-0">
                  <TableCell colSpan={5} className="py-6 px-3 text-center italic text-[#4ade80]/60">
                    No income sources yet — add one above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
