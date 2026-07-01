'use client'

import { useState, useRef, useMemo } from 'react'
import { Loader2, MoreVertical } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { SaveChangesToast } from '@/components/dashboard/SaveChangesToast'
import {
  useSourcesOfIncome,
  useCreateSourceOfIncome,
  useUpdateSourceOfIncome,
  useDeleteSourceOfIncome,
} from '@/hooks/use-sources-of-income'
import { fmtMoney } from '@/lib/format'
import { useCategories } from '@/hooks/use-categories'
import { usePeriod } from '@/providers/period-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CategoryCombobox } from '@/components/dashboard/CategoryCombobox'
import type { SourceOfIncome } from '@/types'

interface RowForm {
  name: string
  category_id: string
  income: string
  date: string
  is_recurring: boolean
}

const emptyForm: RowForm = { name: '', category_id: '', income: '', date: '', is_recurring: true }

type EditField = 'name' | 'category' | 'income'

function formFromSource(source: SourceOfIncome): RowForm {
  return {
    name: source.name,
    category_id: String(source.category_id ?? ''),
    income: String(source.income),
    date: source.date,
    is_recurring: source.is_recurring,
  }
}

function formHasChanges(source: SourceOfIncome, form: RowForm) {
  return (
    form.name.trim() !== source.name ||
    form.category_id !== String(source.category_id ?? '') ||
    (parseFloat(form.income) || 0) !== source.income ||
    form.date !== source.date ||
    form.is_recurring !== source.is_recurring
  )
}

export function IncomeSection() {
  const { date: periodDate } = usePeriod()
  const { data, isLoading } = useSourcesOfIncome()
  const create = useCreateSourceOfIncome()
  const update = useUpdateSourceOfIncome()
  const del = useDeleteSourceOfIncome()

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<RowForm>(emptyForm)
  const [editing, setEditing] = useState<{ id: string; field: EditField } | null>(null)
  const [draft, setDraft] = useState<RowForm>(emptyForm)
  type IncomePayload = { id: string; name: string; category_id: number | null; income: number; date: string; is_recurring: boolean }

  const [pendingEdits, setPendingEdits] = useState<Record<string, RowForm>>({})
  const pendingPayloads = useRef<Record<string, IncomePayload>>({})
  const sharedToastId = useRef<string | number | undefined>(undefined)

  const { data: categoriesData } = useCategories()
  const categoryNameById = new Map((categoriesData?.categories ?? []).map((c) => [String(c.id), c.name]))

  const sources = data ? data.sources_of_income.flatMap((g) => g.sources) : []
  const usedCategoryIds = new Set(sources.map((s) => String(s.category_id)))

  const mergedSources = useMemo(
    () =>
      sources.map((source) => {
        const sourceId = String(source.id)
        if (!pendingEdits[sourceId]) return source
        // Merge pending edits with source
        return {
          ...source,
          name: pendingEdits[sourceId].name,
          category_id: pendingEdits[sourceId].category_id ? parseInt(pendingEdits[sourceId].category_id, 10) : null,
          income: parseFloat(pendingEdits[sourceId].income) || 0,
          date: pendingEdits[sourceId].date || source.date,
          is_recurring: pendingEdits[sourceId].is_recurring,
        } as SourceOfIncome
      }),
    [sources, pendingEdits]
  )

  function mergedForm(source: SourceOfIncome, sourceId?: string): RowForm {
    const id = sourceId ?? String(source.id)
    const pending = pendingEdits[id]
    return pending ?? formFromSource(source)
  }

  function clearAllPending() {
    setPendingEdits({})
    pendingPayloads.current = {}
    if (sharedToastId.current !== undefined) {
      toast.dismiss(sharedToastId.current)
      sharedToastId.current = undefined
    }
    setDraft(emptyForm)
    setEditing(null)
  }

  function showSharedToast(payloads: IncomePayload[]) {
    if (sharedToastId.current !== undefined) toast.dismiss(sharedToastId.current)
    const count = payloads.length
    const tid = toast.custom((t) => (
      <SaveChangesToast
        t={t}
        successMessage={count === 1 ? 'Income source saved' : `${count} income sources saved`}
        onSave={async () => {
          await Promise.all(payloads.map((p) => update.mutateAsync(p)))
          clearAllPending()
        }}
        onRevert={() => clearAllPending()}
      />
    ), { duration: Infinity })
    sharedToastId.current = tid
  }

  function commitChanges(source: SourceOfIncome, form: RowForm) {
    const sourceId = String(source.id)
    const trimmedName = form.name?.trim() || source.name

    if (!trimmedName) return
    if (!formHasChanges(source, form)) return

    const payload: IncomePayload = {
      id: sourceId,
      name: trimmedName,
      category_id: form.category_id ? parseInt(form.category_id, 10) : null,
      income: parseFloat(form.income) || 0,
      date: form.date || source.date,
      is_recurring: form.is_recurring,
    }

    const pendingForm: RowForm = { ...form, name: trimmedName, date: form.date || source.date }
    pendingPayloads.current = { ...pendingPayloads.current, [sourceId]: payload }
    setPendingEdits((prev) => ({ ...prev, [sourceId]: pendingForm }))
    showSharedToast(Object.values(pendingPayloads.current))
  }

  function startEdit(source: SourceOfIncome, field: EditField) {
    const sourceId = String(source.id)
    setEditing({ id: sourceId, field })
    setDraft(pendingEdits[sourceId] ?? formFromSource(source))
  }

  function handleFieldBlur(source: SourceOfIncome) {
    const currentDraft = draft
    setEditing(null)
    setDraft(emptyForm)

    // Ensure name is present, fallback to source name if empty
    const draftWithName = {
      ...currentDraft,
      name: (currentDraft.name?.trim() || source.name || ''),
    }
    commitChanges(source, draftWithName)
  }

  function handleCategoryChange(source: SourceOfIncome, newCategoryId: string) {
    const updatedDraft = { ...draft, category_id: newCategoryId }
    setEditing(null)
    setDraft(emptyForm)

    // Ensure name is present, fallback to source name if empty
    const draftWithName = {
      ...updatedDraft,
      name: (updatedDraft.name?.trim() || source.name || ''),
    }
    commitChanges(source, draftWithName)
  }

  function handleAdd() {
    if (!addForm.name.trim()) return
    create.mutate(
      {
        name: addForm.name.trim(),
        category_id: addForm.category_id ? parseInt(addForm.category_id, 10) : null,
        income: parseFloat(addForm.income) || 0,
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

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-green-800 dark:text-green-400 uppercase tracking-wide">
          Income Sources
        </h2>
        <Button size="sm" onClick={() => setIsAdding(true)} aria-label="Add income">
          + Add Income
        </Button>
      </div>

      <div className="border border-green-700 dark:border-green-800 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
            <Loader2 className="size-6 animate-spin text-green-600 dark:text-green-400" />
          </div>
        ) : (
        <Table className="sheet-table">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="py-2 px-3 h-auto">Name</TableHead>
              <TableHead className="py-2 px-3 h-auto">Category</TableHead>
              <TableHead className="py-2 px-3 h-auto w-32 text-right">Amount</TableHead>
              <TableHead className="py-2 px-3 h-auto text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mergedSources.map((source) => {
              const sourceId = String(source.id)
              const merged = mergedForm(source, sourceId)
              const isEditing = editing?.id === sourceId
              return (
                <TableRow key={source.id} className="border-0">
                  <TableCell className="py-1 px-3">
                    {isEditing && editing.field === 'name' ? (
                      <Input
                        className="h-7 text-sm min-w-0"
                        value={draft.name}
                        onChange={(e) => setDraft((f) => ({ ...f, name: e.target.value }))}
                        onBlur={() => handleFieldBlur(source)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') { e.stopPropagation(); setEditing(null); setDraft(emptyForm) }
                        }}
                        autoFocus
                      />
                    ) : pendingEdits[sourceId] ? (
                      <Input
                        className="h-7 text-sm min-w-0 bg-yellow-50 dark:bg-yellow-900/20"
                        value={draft.name}
                        onChange={(e) => setDraft((f) => ({ ...f, name: e.target.value }))}
                        onBlur={() => handleFieldBlur(source)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') { e.stopPropagation(); setEditing(null); setDraft(emptyForm); setPendingEdits((prev) => { const { [sourceId]: _, ...rest } = prev; return rest }) }
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="w-full text-left cursor-pointer hover:text-green-600 dark:hover:text-[#4ade80] transition-colors truncate block"
                        onClick={() => startEdit(source, 'name')}
                      >
                        {source.name}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="py-1 px-3">
                    {isEditing && editing.field === 'category' || pendingEdits[sourceId] ? (
                      <CategoryCombobox
                        value={draft.category_id}
                        onChange={(id) => handleCategoryChange(source, id)}
                        type="INCOME"
                        usedCategoryIds={usedCategoryIds}
                        autoOpen={isEditing && editing.field === 'category'}
                      />
                    ) : (
                      <button
                        type="button"
                        className="w-full text-left cursor-pointer hover:text-green-600 dark:hover:text-[#4ade80] transition-colors truncate block"
                        onClick={() => startEdit(source, 'category')}
                      >
                        {categoryNameById.get(String(source.category_id)) ?? (
                          <span className="text-green-300 dark:text-green-800">—</span>
                        )}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="py-1 px-3 text-right">
                    {isEditing && editing.field === 'income' ? (
                      <Input
                        type="number"
                        className="h-7 text-sm min-w-0 text-right"
                        min="0"
                        step="0.01"
                        value={draft.income}
                        onChange={(e) => setDraft((f) => ({ ...f, income: e.target.value }))}
                        onBlur={() => handleFieldBlur(source)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') { e.stopPropagation(); setEditing(null); setDraft(emptyForm) }
                        }}
                        autoFocus
                      />
                    ) : pendingEdits[sourceId] ? (
                      <Input
                        type="number"
                        className="h-7 text-sm min-w-0 text-right bg-yellow-50 dark:bg-yellow-900/20"
                        min="0"
                        step="0.01"
                        value={draft.income}
                        onChange={(e) => setDraft((f) => ({ ...f, income: e.target.value }))}
                        onBlur={() => handleFieldBlur(source)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') { e.stopPropagation(); setEditing(null); setDraft(emptyForm); setPendingEdits((prev) => { const { [sourceId]: _, ...rest } = prev; return rest }) }
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        className="w-full text-right cursor-pointer hover:text-green-600 dark:hover:text-[#4ade80] transition-colors font-mono block"
                        onClick={() => startEdit(source, 'income')}
                      >
                        {fmtMoney(source.period_amount)}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="py-1 px-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <IncomeExtraTools
                        source={{ id: source.id, date: merged.date, is_recurring: merged.is_recurring }}
                        onUpdate={(updates) => {
                          const base = pendingEdits[sourceId] ?? formFromSource(source)
                          commitChanges(source, { ...base, date: updates.date, is_recurring: updates.is_recurring })
                        }}
                      />
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() => del.mutate(source.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {isAdding && (
              <TableRow className="add-row border-0">
                <TableCell className="py-1 px-3">
                  <Input
                    className="h-7 text-sm min-w-0"
                    placeholder="Source name"
                    value={addForm.name}
                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd()
                      if (e.key === 'Escape') setIsAdding(false)
                    }}
                    autoFocus
                  />
                </TableCell>
                <TableCell className="py-1 px-3">
                  <CategoryCombobox
                    value={addForm.category_id}
                    onChange={(id) => setAddForm((f) => ({ ...f, category_id: id }))}
                    type="INCOME"
                    usedCategoryIds={usedCategoryIds}
                  />
                </TableCell>
                <TableCell className="py-1 px-3">
                  <Input
                    type="number"
                    className="h-7 text-sm min-w-0 text-right"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={addForm.income}
                    onChange={(e) => setAddForm((f) => ({ ...f, income: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </TableCell>
                <TableCell className="py-1 px-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="xs" onClick={handleAdd}>
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
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
            {!isLoading && !sources.length && !isAdding && (
              <TableRow className="border-0">
                <TableCell colSpan={4} className="py-4 px-3 text-center text-green-600 italic">
                  No income sources yet — add one above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
      </div>
    </section>
  )
}

function IncomeExtraTools({
  source,
  onUpdate,
}: {
  source: { id: string; date: string; is_recurring: boolean }
  onUpdate: (updates: { date: string; is_recurring: boolean }) => void
}) {
  const [open, setOpen] = useState(false)
  const [localDraft, setLocalDraft] = useState({ date: source.date, is_recurring: source.is_recurring })

  return (
    <Popover open={open} onOpenChange={(o) => {
      if (o) setLocalDraft({ date: source.date, is_recurring: source.is_recurring })
      setOpen(o)
    }}>
      <PopoverTrigger className="inline-flex items-center justify-center rounded-md border border-gray-400 dark:border-white text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors px-2 py-1 text-sm">
        <MoreVertical className="h-3 w-3" />
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
              id={`is_recurring_${source.id}`}
              checked={localDraft.is_recurring}
              onCheckedChange={(checked) => setLocalDraft((f) => ({ ...f, is_recurring: Boolean(checked) }))}
            />
            <label htmlFor={`is_recurring_${source.id}`} className="text-sm font-medium cursor-pointer">
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
