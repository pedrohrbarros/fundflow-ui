'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MoreVertical, XIcon } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { SaveChangesToast } from '@/components/dashboard/SaveChangesToast'
import { useQueryClient } from '@tanstack/react-query'
import {
  useSourcesOfIncome,
  useCreateSourceOfIncome,
  useUpdateSourceOfIncome,
  useDeleteSourceOfIncome,
} from '@/hooks/use-sources-of-income'
import { useCategories } from '@/hooks/use-categories'
import { usePeriod } from '@/providers/period-provider'
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
  date: string
  is_recurring: boolean
}

const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'BRL', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN', 'KRW', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'NZD', 'ZAR', 'RUB'] as const

const emptyForm: RowForm = { name: '', category_id: '', income: '', currency: 'USD', date: '', is_recurring: true }

type EditField = 'name' | 'category' | 'income' | 'currency' | 'date'

function formFromSource(source: SourceOfIncome): RowForm {
  return {
    name: source.name,
    category_id: source.category_id ?? '',
    income: String(source.income),
    currency: source.currency ?? 'USD',
    date: source.date,
    is_recurring: source.is_recurring,
  }
}

function formHasChanges(source: SourceOfIncome, form: RowForm) {
  return (
    form.name.trim() !== source.name ||
    form.category_id !== (source.category_id ?? '') ||
    (parseFloat(form.income) || 0) !== source.income ||
    (form.currency || 'USD') !== (source.currency ?? 'USD') ||
    form.date !== source.date ||
    form.is_recurring !== source.is_recurring
  )
}

type SavePayload = { id: string; name: string; category_id: number | null; income: number; currency: string; date: string; is_recurring: boolean }

export function IncomeModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const { date: periodDate } = usePeriod()
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
  // Mobile-only: tap a row (or the add button) to edit all fields in one modal.
  const [rowForm, setRowForm] = useState<{ mode: 'add' } | { mode: 'edit'; source: SourceOfIncome } | null>(null)

  const originalSnapshot = useRef<SourcesOfIncomeResponse | undefined>(undefined)
  const pendingPayloads = useRef<Map<string, SavePayload>>(new Map())
  const sharedToastId = useRef<string | number | undefined>(undefined)

  const sources = data ? data.sources_of_income.flatMap((g) => g.sources) : []
  const usedCategoryIds = new Set(sources.map((s) => String(s.category_id)))
  const isEmpty = !isLoading && !sources.length && !isAdding

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categoriesData?.categories.forEach((c) => map.set(c.id, c.name))
    if (data?.sources_of_income) {
      for (const group of data.sources_of_income) {
        if (group.category_id != null && group.category_name) {
          map.set(String(group.category_id), group.category_name)
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
      setRowForm(null)
      originalSnapshot.current = undefined
      pendingPayloads.current = new Map()
      if (sharedToastId.current !== undefined) {
        toast.dismiss(sharedToastId.current)
        sharedToastId.current = undefined
      }
    }
  }, [open])

  function handleAdd() {
    if (!addForm.name.trim()) return
    create.mutate(
      {
        name: addForm.name.trim(),
        category_id: addForm.category_id ? parseInt(addForm.category_id, 10) : null,
        income: parseFloat(addForm.income) || 0,
        currency: addForm.currency || 'USD',
        date: addForm.date || periodDate,
        is_recurring: addForm.is_recurring,
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

    const newCatId = payload.category_id == null ? null : String(payload.category_id)

    // Update the source in place within whichever group holds it. If its category
    // changed, the regrouping is reconciled by the refetch on mutation success.
    const newGroups = old.sources_of_income.map((group) => ({
      ...group,
      sources: group.sources.map((s) =>
        String(s.id) === String(payload.id)
          ? {
              ...s,
              name: payload.name,
              income: payload.income,
              period_amount: payload.income,
              currency: payload.currency,
              category_id: newCatId,
              date: payload.date,
              is_recurring: payload.is_recurring,
            }
          : s,
      ),
    }))

    qc.setQueryData<SourcesOfIncomeResponse>(['sources-of-income'], {
      ...old,
      sources_of_income: newGroups,
    })
    return old
  }

  function clearAllPending() {
    if (originalSnapshot.current) {
      qc.setQueryData(['sources-of-income'], originalSnapshot.current)
      originalSnapshot.current = undefined
    }
    pendingPayloads.current = new Map()
    if (sharedToastId.current !== undefined) {
      toast.dismiss(sharedToastId.current)
      sharedToastId.current = undefined
    }
    // Close any active inline editor now that pending edits are resolved.
    setEditing(null)
    setDraft(emptyForm)
  }

  function commitToSharedToast(payload: SavePayload) {
    if (!originalSnapshot.current) {
      originalSnapshot.current = qc.getQueryData<SourcesOfIncomeResponse>(['sources-of-income'])
    }
    applyOptimisticUpdate(payload)
    pendingPayloads.current.set(payload.id, payload)

    if (sharedToastId.current !== undefined) toast.dismiss(sharedToastId.current)

    const payloads = Array.from(pendingPayloads.current.values())
    const count = payloads.length
    const tid = toast.custom((t) => (
      <SaveChangesToast
        t={t}
        successMessage={count === 1 ? 'Income source saved' : `${count} income sources saved`}
        onSave={async () => {
          await Promise.all(payloads.map((p) => update.mutateAsync(p)))
          originalSnapshot.current = undefined
          pendingPayloads.current = new Map()
          sharedToastId.current = undefined
          setEditing(null)
          setDraft(emptyForm)
        }}
        onRevert={() => clearAllPending()}
      />
    ), { duration: Infinity })
    sharedToastId.current = tid
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
    // Keep the field active until the user saves/discards — just track the draft.
    setDraft(updatedDraft)

    if (!formHasChanges(source, updatedDraft) || !updatedDraft.name.trim()) return

    commitToSharedToast({
      id: sourceId,
      name: updatedDraft.name.trim(),
      category_id: newCategoryId ? parseInt(newCategoryId, 10) : null,
      income: parseFloat(updatedDraft.income) || 0,
      currency: updatedDraft.currency || 'USD',
      date: updatedDraft.date,
      is_recurring: updatedDraft.is_recurring,
    })
  }

  function handleFieldBlur(sourceId: string) {
    const source = sources.find((s) => s.id === sourceId)
    if (!source) return

    // Keep the input active (do not close on blur). Only commit when there is
    // an actual change; the editor closes on Escape or when Save/Discard is clicked.
    if (!formHasChanges(source, draft) || !draft.name.trim()) return

    commitToSharedToast({
      id: sourceId,
      name: draft.name.trim(),
      category_id: draft.category_id ? parseInt(draft.category_id, 10) : null,
      income: parseFloat(draft.income) || 0,
      currency: draft.currency || 'USD',
      date: draft.date,
      is_recurring: draft.is_recurring,
    })
  }

  function submitRowForm(form: RowForm) {
    if (rowForm?.mode === 'edit') {
      const source = rowForm.source
      if (form.name.trim() && formHasChanges(source, form)) {
        commitToSharedToast({
          id: source.id,
          name: form.name.trim(),
          category_id: form.category_id ? parseInt(form.category_id, 10) : null,
          income: parseFloat(form.income) || 0,
          currency: form.currency || 'USD',
          date: form.date || source.date,
          is_recurring: form.is_recurring,
        })
      }
      setRowForm(null)
    } else {
      if (!form.name.trim()) return
      create.mutate(
        {
          name: form.name.trim(),
          category_id: form.category_id ? parseInt(form.category_id, 10) : null,
          income: parseFloat(form.income) || 0,
          currency: form.currency || 'USD',
          date: form.date || periodDate,
          is_recurring: form.is_recurring,
        },
        { onSuccess: () => setRowForm(null) },
      )
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent
        className="income-modal-dark sm:max-w-6xl w-[min(98vw,72rem)] h-[min(92dvh,52rem)] flex flex-col p-0 bg-white dark:bg-[#0f1a0f] ring-green-700 dark:ring-[#166534] gap-0 overflow-hidden rounded-none sm:rounded-xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Income sources</DialogTitle>

        {/* Mobile-only top bar (above the table) holding the close button */}
        <div className="sm:hidden relative h-11 shrink-0 border-b border-green-100 dark:border-[#166534]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-1.5 right-2 p-1.5 rounded-md text-gray-700 dark:text-[#86efac] hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Table area */}
        <div className="overflow-auto min-h-0 flex-1 relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-16" role="status" aria-label="Loading">
              <Loader2 className="size-6 animate-spin text-green-700 dark:text-[#86efac]" />
            </div>
          ) : (
          <>
          {/* Mobile: tap-to-edit card list (no wide table) */}
          <div className="sm:hidden flex flex-col">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[#166534] px-4 py-3 text-sm font-semibold text-white">
              <span>Name</span>
              <span>Amount</span>
            </div>
            {sources.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => setRowForm({ mode: 'edit', source })}
                className="flex items-center justify-between gap-3 border-b border-green-100 dark:border-[#166534] px-4 py-3 text-left active:bg-green-50 dark:active:bg-[#1a2e1a] transition-colors"
              >
                <span className="min-w-0 flex flex-col">
                  <span className="truncate font-medium text-gray-900 dark:text-[#d1fae5]">{source.name}</span>
                  <span className="truncate text-xs text-green-700 dark:text-[#86efac]">{getCategoryName(source)}</span>
                </span>
                <span className="shrink-0 flex flex-col items-end">
                  <span className="font-mono text-sm text-gray-900 dark:text-[#d1fae5]">{fmtMoney(source.period_amount)}</span>
                  <span className="text-[10px] font-mono text-green-700 dark:text-[#86efac]">{source.currency ?? 'USD'}</span>
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRowForm({ mode: 'add' })}
              className="px-4 py-3 text-center text-green-700 dark:text-[#4ade80] font-medium active:bg-green-50 dark:active:bg-[#1a2e1a] transition-colors"
            >
              + Add income
            </button>
          </div>

          {/* Desktop: inline-editable table */}
          <Table className="sheet-table table-fixed hidden sm:table">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="py-2 px-3 h-auto">Name</TableHead>
                <TableHead className="py-2 px-3 h-auto w-28 sm:w-40 lg:w-64">Category</TableHead>
                <TableHead className="py-2 px-3 h-auto w-24 sm:w-28 lg:w-36 text-right">Amount</TableHead>
                <TableHead className="py-2 px-3 h-auto w-20 sm:w-24 lg:w-32">Currency</TableHead>
                <TableHead className="py-2 px-3 h-auto w-28 lg:w-32 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
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
                          {fmtMoney(source.period_amount)}
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
                    <TableCell className="py-2.5 px-3 text-right flex items-center justify-end gap-2">
                      <IncomeModalExtraTools source={source} onUpdate={(updates) => {
                        commitToSharedToast({
                          id: source.id,
                          name: source.name,
                          category_id: source.category_id ? parseInt(source.category_id, 10) : null,
                          income: source.income,
                          currency: source.currency ?? 'USD',
                          date: updates.date,
                          is_recurring: updates.is_recurring,
                        })
                      }} />
                      <Button
                        variant="destructive"
                        size="icon"
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
                  <TableCell className="py-2.5 px-3 text-right">
                    <div className="flex gap-2 items-center justify-end">
                      <Button
                        size="sm"
                        onClick={handleAdd}
                        disabled={create.isPending || !(parseFloat(addForm.income) > 0)}
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
                  aria-label="Add income"
                >
                  <TableCell
                    colSpan={5}
                    className="py-2 px-3 text-center text-green-700/40 dark:text-[#4ade80]/40 select-none group-hover:text-green-600/70 dark:group-hover:text-[#4ade80]/70 transition-colors"
                  >
                    <span className="text-xl leading-none font-light" aria-hidden="true">+</span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {isEmpty && (
            <div className="absolute inset-0 hidden sm:flex items-center justify-center">
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
          </>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {rowForm && (
      <IncomeRowFormModal
        mode={rowForm.mode}
        source={rowForm.mode === 'edit' ? rowForm.source : null}
        usedCategoryIds={usedCategoryIds}
        periodDate={periodDate}
        isSaving={create.isPending}
        onDelete={
          rowForm.mode === 'edit'
            ? () => {
                const id = (rowForm as { source: SourceOfIncome }).source.id
                setDeletingSourceId(id)
                deleteSource.mutate(id, { onSettled: () => setDeletingSourceId(null) })
                setRowForm(null)
              }
            : undefined
        }
        onClose={() => setRowForm(null)}
        onSubmit={submitRowForm}
      />
    )}
    </>
  )
}

function IncomeRowFormModal({
  mode,
  source,
  usedCategoryIds,
  periodDate,
  isSaving,
  onDelete,
  onClose,
  onSubmit,
}: {
  mode: 'add' | 'edit'
  source: SourceOfIncome | null
  usedCategoryIds: Set<string>
  periodDate: string
  isSaving: boolean
  onDelete?: () => void
  onClose: () => void
  onSubmit: (form: RowForm) => void
}) {
  const [form, setForm] = useState<RowForm>(
    source
      ? { ...formFromSource(source), category_id: String(source.category_id ?? '') }
      : { ...emptyForm, date: periodDate },
  )

  const canSave = form.name.trim().length > 0

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent
        className="income-modal-dark w-[min(94vw,26rem)] bg-white dark:bg-[#0f1a0f] ring-green-700 dark:ring-[#166534] text-gray-900 dark:text-[#d1fae5]"
        showCloseButton={false}
      >
        {/* Mobile-only close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="sm:hidden absolute top-2 right-2 p-1.5 rounded-md text-gray-700 dark:text-[#86efac] hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <DialogTitle>{mode === 'add' ? 'Add income' : 'Edit income'}</DialogTitle>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Source name"
              className="w-full bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <CategoryCombobox
              value={form.category_id}
              onChange={(id) => setForm((f) => ({ ...f, category_id: id }))}
              type="INCOME"
              usedCategoryIds={usedCategoryIds}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5">Amount</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.income}
                onChange={(e) => setForm((f) => ({ ...f, income: e.target.value }))}
                placeholder="0.00"
                className="w-full text-right bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
              />
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium mb-1.5">Currency</label>
              <select
                className="h-9 w-full text-sm bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5] rounded px-2.5"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Date</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="row_form_recurring"
              checked={form.is_recurring}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, is_recurring: Boolean(checked) }))}
            />
            <label htmlFor="row_form_recurring" className="text-sm font-medium cursor-pointer">
              Recurring
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <Button className="flex-1" disabled={!canSave || isSaving} onClick={() => onSubmit(form)}>
              {isSaving ? <Loader2 className="animate-spin" /> : 'Save'}
            </Button>
            {mode === 'edit' && onDelete && (
              <Button variant="destructive" size="icon" aria-label="Delete income source" onClick={onDelete}>
                ✕
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function IncomeModalExtraTools({
  source,
  onUpdate,
}: {
  source: SourceOfIncome
  onUpdate: (updates: { date: string; is_recurring: boolean }) => void
}) {
  const [open, setOpen] = useState(false)
  const [localDraft, setLocalDraft] = useState({ date: source.date, is_recurring: source.is_recurring })

  return (
    <Popover open={open} onOpenChange={(o) => {
      if (o) setLocalDraft({ date: source.date, is_recurring: source.is_recurring })
      setOpen(o)
    }}>
      <PopoverTrigger className="inline-flex items-center justify-center rounded-md border border-gray-400 dark:border-white text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors px-2.5 py-1.5">
        <MoreVertical className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="bg-white dark:bg-[#0f1a0f] border border-green-100 dark:border-[#166534] p-4 w-64 text-gray-900 dark:text-[#d1fae5]">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <Input
              type="date"
              value={localDraft.date}
              onChange={(e) => setLocalDraft((f) => ({ ...f, date: e.target.value }))}
              className="w-full bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`is_recurring_modal_${source.id}`}
              checked={localDraft.is_recurring}
              onCheckedChange={(checked) => setLocalDraft((f) => ({ ...f, is_recurring: Boolean(checked) }))}
            />
            <label htmlFor={`is_recurring_modal_${source.id}`} className="text-sm font-medium cursor-pointer">
              Recurring
            </label>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onUpdate({ date: localDraft.date, is_recurring: localDraft.is_recurring })
              setOpen(false)
            }}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
