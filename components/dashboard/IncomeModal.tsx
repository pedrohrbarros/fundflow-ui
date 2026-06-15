'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useSourcesOfIncome,
  useCreateSourceOfIncome,
  useUpdateSourceOfIncome,
  useDeleteSourceOfIncome,
} from '@/hooks/use-sources-of-income'
import { useCategories } from '@/hooks/use-categories'
import { fmtMoney } from '@/lib/format'
import type { SourceOfIncome, SourcesOfIncomeResponse } from '@/types'
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

type SavePayload = { id: string; name: string; category_id: number; income: number; currency: string }

function SaveToastContent({
  t,
  payload,
  onSave,
  onRevert,
}: {
  t: number | string
  payload: SavePayload
  onSave: (payload: SavePayload) => Promise<void>
  onRevert: () => void
}) {
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(payload)
      toast.custom(() => (
        <div className="flex items-center gap-3 bg-[#0f1a0f] border border-[#166534] rounded-xl px-4 py-3 shadow-xl w-full">
          <span className="text-[#4ade80] text-sm">✓</span>
          <p className="text-sm text-[#d1fae5]">Income source saved</p>
        </div>
      ))
    } catch {
      onRevert()
      toast.error('Failed to save changes')
    } finally {
      toast.dismiss(t)
    }
  }

  return (
    <div className="flex items-center gap-4 bg-[#0f1a0f] border border-[#166534] rounded-xl px-4 py-3 shadow-xl w-full">
      <p className="flex-1 text-sm text-[#d1fae5]">Save your changes?</p>
      <div className="flex gap-2 shrink-0">
        <button
          className="h-7 px-3 text-sm font-medium rounded-lg bg-[#166534] text-[#d1fae5] hover:bg-[#14532d] cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          onClick={handleSave}
          disabled={saving}
        >
          {saving && <Loader2 className="size-3 animate-spin" />}
          Save
        </button>
        <button
          className="h-7 px-3 text-sm font-medium rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 cursor-pointer transition-colors disabled:opacity-50"
          onClick={() => { onRevert(); toast.dismiss(t) }}
          disabled={saving}
        >
          Discard
        </button>
      </div>
    </div>
  )
}

export function IncomeModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const { data, isLoading } = useSourcesOfIncome()
  const { data: categoriesData } = useCategories()
  const create = useCreateSourceOfIncome()
  const update = useUpdateSourceOfIncome()
  const deleteSource = useDeleteSourceOfIncome()

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<RowForm>(emptyForm)
  const [editing, setEditing] = useState<{ id: string; field: EditField } | null>(null)
  const [draft, setDraft] = useState<RowForm>(emptyForm)
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null)

  const sources = data ? Object.values(data.sources_of_income).flat() : []
  const usedCategoryIds = new Set(sources.map((s) => String(s.category_id)))
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

  function applyOptimisticUpdate(payload: SavePayload): SourcesOfIncomeResponse | undefined {
    const old = qc.getQueryData<SourcesOfIncomeResponse>(['sources-of-income'])
    if (!old) return undefined

    const newCatId = String(payload.category_id)
    const newCatName = categoryNameById.get(newCatId)

    let currentCatName: string | undefined
    let foundSource: SourceOfIncome | undefined
    for (const [catName, items] of Object.entries(old.sources_of_income)) {
      const item = items.find((i) => i.id === payload.id)
      if (item) { currentCatName = catName; foundSource = item; break }
    }
    if (!foundSource) return old

    const updated: SourceOfIncome = {
      ...foundSource,
      name: payload.name,
      income: payload.income,
      currency: payload.currency,
      category_id: newCatId,
    }

    const categoryChanged = foundSource.category_id !== newCatId
    const newSources: SourcesOfIncomeResponse['sources_of_income'] = {}

    if (!categoryChanged) {
      for (const [catName, items] of Object.entries(old.sources_of_income)) {
        newSources[catName] = items.map((i) => (i.id === payload.id ? updated : i))
      }
    } else {
      for (const [catName, items] of Object.entries(old.sources_of_income)) {
        const filtered = items.filter((i) => i.id !== payload.id)
        if (filtered.length > 0 || catName === currentCatName) newSources[catName] = filtered
      }
      const targetName = newCatName ?? newCatId
      newSources[targetName] = [...(newSources[targetName] ?? []), updated]
    }

    qc.setQueryData<SourcesOfIncomeResponse>(['sources-of-income'], {
      ...old,
      sources_of_income: newSources,
    })
    return old
  }

  function showSaveToast(payload: SavePayload, onRevert: () => void) {
    toast.custom((t) => (
      <SaveToastContent
        t={t}
        payload={payload}
        onSave={async (p) => { await update.mutateAsync(p) }}
        onRevert={onRevert}
      />
    ), { duration: Infinity })
  }

  function startFieldEdit(source: SourceOfIncome, field: EditField) {
    setEditing({ id: source.id, field })
    setDraft(formFromSource(source))
  }

  function handleCategoryChange(sourceId: string, newCategoryId: string) {
    const source = sources.find((s) => s.id === sourceId)
    if (!source) {
      setEditing(null)
      setDraft(emptyForm)
      return
    }

    const updatedDraft = { ...draft, category_id: newCategoryId }

    setEditing(null)
    setDraft(emptyForm)

    if (!formHasChanges(source, updatedDraft) || !updatedDraft.name.trim()) return

    const payload = {
      id: sourceId,
      name: updatedDraft.name.trim(),
      category_id: parseInt(newCategoryId, 10),
      income: parseFloat(updatedDraft.income) || 0,
      currency: updatedDraft.currency || 'USD',
    }

    const oldData = applyOptimisticUpdate(payload)
    showSaveToast(payload, () => { if (oldData) qc.setQueryData(['sources-of-income'], oldData) })
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

    const oldData = applyOptimisticUpdate(payload)
    showSaveToast(payload, () => { if (oldData) qc.setQueryData(['sources-of-income'], oldData) })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent
        className="income-modal-dark sm:max-w-6xl w-[min(98vw,72rem)] h-[min(92dvh,52rem)] flex flex-col p-0 bg-white dark:bg-[#0f1a0f] ring-green-700 dark:ring-[#166534] gap-0 overflow-hidden rounded-none sm:rounded-xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Income sources</DialogTitle>

        {/* Table area */}
        <div className="overflow-auto min-h-0 flex-1 relative">
          <Table className="sheet-table table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="py-2 px-3 h-auto">Name</TableHead>
                <TableHead className="py-2 px-3 h-auto w-28 sm:w-40 lg:w-64">Category</TableHead>
                <TableHead className="py-2 px-3 h-auto w-24 sm:w-28 lg:w-36 text-right">Amount</TableHead>
                <TableHead className="py-2 px-3 h-auto w-20 sm:w-24 lg:w-32">Currency</TableHead>
                <TableHead className="py-2 px-3 h-auto w-28 lg:w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow className="border-0">
                  <TableCell colSpan={5} className="py-6 px-3 text-center text-green-700 dark:text-[#86efac]">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {sources.map((source) => {
                const isEditing = editing?.id === source.id
                return (
                  <TableRow key={source.id} className="border-0 group/row">
                    <TableCell className="py-2.5 px-3 overflow-hidden">
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
                          className="w-full text-left cursor-pointer hover:text-green-600 dark:hover:text-[#4ade80] transition-colors truncate block"
                          onClick={() => startFieldEdit(source, 'name')}
                        >
                          {source.name}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 overflow-hidden">
                      {isEditing && editing.field === 'category' ? (
                        <CategoryCombobox
                          value={draft.category_id}
                          onChange={(id) => handleCategoryChange(source.id, id)}
                          type="INCOME"
                          usedCategoryIds={usedCategoryIds}
                          autoOpen
                        />
                      ) : (
                        <div className="flex items-center gap-1 min-w-0">
                          <button
                            type="button"
                            className="flex-1 min-w-0 text-left cursor-pointer hover:text-green-600 dark:hover:text-[#4ade80] transition-colors truncate"
                            onClick={() => startFieldEdit(source, 'category')}
                          >
                            {getCategoryName(source)}
                          </button>
                        </div>
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
                          className="w-full text-right cursor-pointer hover:text-green-600 dark:hover:text-[#4ade80] transition-colors font-mono"
                          onClick={() => startFieldEdit(source, 'income')}
                        >
                          {fmtMoney(source.income)}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      {isEditing && editing.field === 'currency' ? (
                        <select
                          className="h-8 text-sm bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5] rounded px-2.5 w-full"
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
                          className="text-xs font-mono text-green-700 dark:text-[#86efac] cursor-pointer hover:text-green-600 dark:hover:text-[#4ade80] transition-colors"
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
                        onClick={() => {
                          setDeletingSourceId(source.id)
                          deleteSource.mutate(source.id, { onSettled: () => setDeletingSourceId(null) })
                        }}
                        disabled={deleteSource.isPending}
                        aria-label="Delete income source"
                      >
                        {deletingSourceId === source.id ? <Loader2 className="animate-spin" /> : '✕'}
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
                      type="INCOME"
                      usedCategoryIds={usedCategoryIds}
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
                      className="h-8 text-sm bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5] rounded px-2.5 w-full"
                      value={addForm.currency}
                      onChange={(e) => setAddForm((f) => ({ ...f, currency: e.target.value }))}
                    >
                      {COMMON_CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="py-2.5 px-3">
                    <div className="flex gap-2 items-center justify-end">
                      <Button
                        size="sm"
                        onClick={handleAdd}
                        disabled={create.isPending || !(parseFloat(addForm.income) > 0) || !addForm.category_id}
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
                  className="border-0 cursor-pointer group add-hint"
                  onClick={() => setIsAdding(true)}
                >
                  <TableCell
                    colSpan={5}
                    className="py-2 px-3 text-green-700/40 dark:text-[#4ade80]/40 select-none group-hover:text-green-600/70 dark:group-hover:text-[#4ade80]/70 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-base leading-none font-light">+</span>
                      <span>Add income…</span>
                    </span>
                  </TableCell>
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
                className="w-12 h-12 rounded-full border-2 border-dashed border-green-700 dark:border-[#166534] text-green-700/50 dark:text-[#4ade80]/50 text-2xl flex items-center justify-center hover:border-green-600 dark:hover:border-[#4ade80] hover:text-green-600 dark:hover:text-[#4ade80] hover:bg-green-50 dark:hover:bg-[#1a2e1a] transition-all duration-150"
              >
                +
              </button>
            </div>
          )}
        </div>

        {sources.length > 0 && (
          <div className="shrink-0 border-t border-green-700 dark:border-[#166534] bg-green-800 dark:bg-[#14532d] flex items-center justify-between px-3 py-2.5">
            <span className="text-sm font-semibold text-white dark:text-[#bbf7d0]">
              {totalCurrency ? 'TOTAL' : 'TOTAL (RAW, MIXED CURRENCIES)'}
            </span>
            <span className="text-sm font-mono font-semibold text-green-200 dark:text-[#4ade80]">
              {totalCurrency ? fmtMoney(total, totalCurrency) : total.toFixed(2)}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
