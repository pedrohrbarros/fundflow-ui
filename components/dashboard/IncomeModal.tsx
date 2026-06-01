'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useSourcesOfIncome,
  useCreateSourceOfIncome,
  useUpdateSourceOfIncome,
  useDeleteSourceOfIncome,
} from '@/hooks/use-sources-of-income'
import { useCategories } from '@/hooks/use-categories'
import { fmtMoney } from '@/lib/format'
import type { SourceOfIncome } from '@/types'
import { CategoryCombobox } from './CategoryCombobox'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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

type EditField = 'name' | 'category' | 'income' | 'currency'

function formFromSource(source: SourceOfIncome): RowForm {
  return {
    name: source.name,
    category_id: source.category_id,
    income: String(source.income),
    currency: source.currency ?? 'USD',
  }
}

function formHasChanges(source: SourceOfIncome, form: RowForm) {
  return (
    form.name.trim() !== source.name ||
    form.category_id !== source.category_id ||
    (parseFloat(form.income) || 0) !== source.income ||
    (form.currency || 'USD') !== (source.currency ?? 'USD')
  )
}

export function IncomeModal({ open, onClose }: Props) {
  const { data, isLoading } = useSourcesOfIncome()
  const { data: categoriesData } = useCategories()
  const create = useCreateSourceOfIncome()
  const update = useUpdateSourceOfIncome()
  const deleteSource = useDeleteSourceOfIncome()

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<RowForm>(emptyForm)
  const [editing, setEditing] = useState<{ id: string; field: EditField } | null>(null)
  const [draft, setDraft] = useState<RowForm>(emptyForm)

  const sources = data ? Object.values(data.sources_of_income).flat() : []
  const total = sources.reduce((sum, s) => sum + s.income, 0)
  const distinctCurrencies = new Set(sources.map((source) => source.currency ?? 'USD'))
  const totalCurrency = distinctCurrencies.size === 1 ? distinctCurrencies.values().next().value : null
  const isEmpty = !isLoading && !sources.length && !isAdding

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categoriesData?.categories.forEach((c) => map.set(c.id, c.name))
    if (data?.sources_of_income) {
      for (const [categoryName, list] of Object.entries(data.sources_of_income)) {
        for (const source of list) {
          map.set(String(source.category_id), categoryName)
        }
      }
    }
    return map
  }, [categoriesData, data])

  function getCategoryName(source: SourceOfIncome) {
    return categoryNameById.get(String(source.category_id)) ?? '—'
  }

  useEffect(() => {
    if (!open) {
      setIsAdding(false)
      setAddForm(emptyForm)
      setEditing(null)
      setDraft(emptyForm)
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

  function startFieldEdit(source: SourceOfIncome, field: EditField) {
    setEditing({ id: source.id, field })
    setDraft(formFromSource(source))
  }

  function handleFieldBlur(sourceId: string) {
    const source = sources.find((s) => s.id === sourceId)
    if (!source) {
      setEditing(null)
      setDraft(emptyForm)
      return
    }

    if (!formHasChanges(source, draft) || !draft.name.trim() || !draft.category_id) {
      setEditing(null)
      setDraft(emptyForm)
      return
    }

    const payload = {
      id: sourceId,
      name: draft.name.trim(),
      category_id: parseInt(draft.category_id, 10),
      income: parseFloat(draft.income) || 0,
      currency: draft.currency || 'USD',
    }

    setEditing(null)
    setDraft(emptyForm)

    toast('Save your changes?', {
      action: {
        label: 'Save',
        onClick: () => {
          update.mutate(payload, {
            onSuccess: () => toast.success('Income source saved'),
          })
        },
      },
      cancel: {
        label: 'Discard',
        onClick: () => {},
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent
        className="income-modal-dark sm:max-w-6xl w-[min(96vw,72rem)] h-[min(90vh,52rem)] flex flex-col p-0 bg-[#0f1a0f] ring-[#166534] gap-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Income sources</DialogTitle>

        {/* Table area */}
        <div className="overflow-auto min-h-0 flex-1 relative">
          <Table className="sheet-table">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="py-2 px-3 h-auto">Name</TableHead>
                <TableHead className="py-2 px-3 h-auto">Category</TableHead>
                <TableHead className="py-2 px-3 h-auto w-32 text-right">Amount</TableHead>
                <TableHead className="py-2 px-3 h-auto w-24">Currency</TableHead>
                <TableHead className="py-2 px-3 h-auto w-12" />
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
              {sources.map((source) => {
                const isEditing = editing?.id === source.id
                return (
                  <TableRow key={source.id} className="border-0">
                    <TableCell className="py-2.5 px-3">
                      {isEditing && editing.field === 'name' ? (
                        <Input
                          className="h-7 text-sm min-w-0"
                          value={draft.name}
                          onChange={(e) =>
                            setDraft((f) => ({ ...f, name: e.target.value }))
                          }
                          onBlur={() => handleFieldBlur(source.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.stopPropagation()
                              setEditing(null)
                              setDraft(emptyForm)
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className="w-full text-left cursor-pointer hover:text-[#4ade80] transition-colors"
                          onClick={() => startFieldEdit(source, 'name')}
                        >
                          {source.name}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      {isEditing && editing.field === 'category' ? (
                        <div
                          onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              handleFieldBlur(source.id)
                            }
                          }}
                        >
                          <CategoryCombobox
                            value={draft.category_id}
                            onChange={(id) =>
                              setDraft((f) => ({ ...f, category_id: id }))
                            }
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-full text-left cursor-pointer hover:text-[#4ade80] transition-colors"
                          onClick={() => startFieldEdit(source, 'category')}
                        >
                          {getCategoryName(source)}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-right amount-col">
                      {isEditing && editing.field === 'income' ? (
                        <Input
                          className="h-7 text-sm min-w-0 text-right"
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.income}
                          onChange={(e) =>
                            setDraft((f) => ({ ...f, income: e.target.value }))
                          }
                          onBlur={() => handleFieldBlur(source.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.stopPropagation()
                              setEditing(null)
                              setDraft(emptyForm)
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className="w-full text-right cursor-pointer hover:text-[#4ade80] transition-colors font-mono"
                          onClick={() => startFieldEdit(source, 'income')}
                        >
                          {fmtMoney(source.income)}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      {isEditing && editing.field === 'currency' ? (
                        <select
                          className="h-7 text-sm bg-[#1a2e1a] border border-[#166534] text-[#d1fae5] rounded px-1 w-20"
                          value={draft.currency}
                          onChange={(e) => setDraft((f) => ({ ...f, currency: e.target.value }))}
                          onBlur={() => handleFieldBlur(source.id)}
                          autoFocus
                        >
                          {COMMON_CURRENCIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          type="button"
                          className="text-xs font-mono text-[#86efac] cursor-pointer hover:text-[#4ade80] transition-colors"
                          onClick={() => startFieldEdit(source, 'currency')}
                        >
                          {source.currency ?? 'USD'}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => deleteSource.mutate(source.id)}
                        disabled={deleteSource.isPending}
                        aria-label="Delete income source"
                      >
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
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
                    <div className="flex gap-2 items-center">
                      <Button
                        size="sm"
                        onClick={handleAdd}
                        disabled={create.isPending || !(parseFloat(addForm.amount) > 0)}
                      >
                        {create.isPending ? <Loader2 className="animate-spin" /> : 'Save'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => { setIsAdding(false); setAddForm(emptyForm) }}
                        aria-label="Cancel"
                      >
                        ✕
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isAdding && sources.length > 0 && (
                <TableRow
                  className="border-0 cursor-pointer group"
                  onClick={() => setIsAdding(true)}
                >
                  <TableCell
                    colSpan={5}
                    className="py-2 px-3 text-[#4ade80]/40 select-none group-hover:text-[#4ade80]/70 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-base leading-none font-light">+</span>
                      <span className="italic">Add income…</span>
                    </span>
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
            </TableBody>
          </Table>
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                aria-label="Add income"
                onClick={() => setIsAdding(true)}
                className="w-12 h-12 rounded-full border-2 border-dashed border-[#166534] text-[#4ade80]/50 text-2xl flex items-center justify-center hover:border-[#4ade80] hover:text-[#4ade80] hover:bg-[#1a2e1a] transition-all duration-150"
              >
                +
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
