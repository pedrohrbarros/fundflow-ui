'use client'

import { useRef, useState } from 'react'
import { Loader2, MoreVertical } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { toast } from 'sonner'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses'
import { fmtMoney } from '@/lib/format'
import type { Expense } from '@/types'
import { PaymentMethodCombobox } from '@/components/dashboard/PaymentMethodCombobox'
import { CategoryCombobox } from '@/components/dashboard/CategoryCombobox'
import { ColumnHeader } from '@/components/dashboard/ColumnHeader'
import { SaveChangesToast } from '@/components/dashboard/SaveChangesToast'
import type { ExpenseFilter } from '@/lib/expense-filters'
import { useCategories } from '@/hooks/use-categories'
import { usePeriod } from '@/providers/period-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface RowForm {
  name: string
  amount: string
  category_id: string
  is_paid: boolean
  is_saved: boolean
  payment_method_id: string
  date: string
  is_recurring: boolean
}

type EditField = 'name' | 'category' | 'amount' | 'date' | 'payment_method'

type ExpenseUpdatePayload = {
  id: string
  name: string
  category_id: number | null
  amount: number
  date: string
  is_recurring: boolean
  is_paid: boolean
  is_saved: boolean
  payment_methods: { payment_method_id: number; partial_amount: number }[]
}

const emptyForm: RowForm = { name: '', amount: '', category_id: '', is_paid: false, is_saved: false, payment_method_id: '', date: '', is_recurring: false }

function ExpensesTableColgroup() {
  return (
    <colgroup>
      <col style={{ width: '28%' }} />
      <col style={{ width: '12%' }} />
      <col style={{ width: '12%' }} />
      <col style={{ width: '18%' }} />
      <col style={{ width: '30%' }} />
    </colgroup>
  )
}

function formFromExpense(expense: Expense): RowForm {
  return {
    name: expense.name,
    amount: String(expense.amount),
    category_id: String(expense.category_id ?? ''),
    is_paid: expense.is_paid,
    is_saved: expense.is_saved,
    payment_method_id: expense.payment_methods[0]?.payment_method_id ?? '',
    date: expense.date,
    is_recurring: expense.is_recurring,
  }
}

function formHasChanges(expense: Expense, form: RowForm) {
  const amount = parseFloat(form.amount) || 0
  const paymentMethodId = form.payment_method_id || ''
  const expensePaymentMethodId = expense.payment_methods[0]?.payment_method_id ?? ''

  return (
    form.name.trim() !== expense.name ||
    String(expense.category_id ?? '') !== form.category_id ||
    amount !== expense.amount ||
    form.date !== expense.date ||
    paymentMethodId !== expensePaymentMethodId
  )
}

function buildPayload(id: string, form: RowForm, expense: Expense): ExpenseUpdatePayload {
  const amount = parseFloat(form.amount) || 0
  return {
    id,
    name: form.name.trim(),
    amount,
    category_id: form.category_id ? parseInt(form.category_id, 10) : null,
    date: form.date,
    is_recurring: form.is_recurring,
    is_paid: expense.is_paid,
    is_saved: expense.is_saved,
    payment_methods: form.payment_method_id
      ? [{ payment_method_id: parseInt(form.payment_method_id, 10), partial_amount: amount }]
      : [],
  }
}

function mergePendingExpense(expense: Expense, payload: ExpenseUpdatePayload): Expense {
  const existingPm = expense.payment_methods?.[0]
  const nextPm = payload.payment_methods[0]
  return {
    ...expense,
    name: payload.name,
    amount: payload.amount,
    category_id: payload.category_id == null ? null : String(payload.category_id),
    date: payload.date,
    payment_methods: nextPm
      ? [{
          payment_method_id: String(nextPm.payment_method_id),
          partial_amount: nextPm.partial_amount,
          name: existingPm?.payment_method_id === String(nextPm.payment_method_id) ? existingPm.name : existingPm?.name ?? '',
          origin: existingPm?.origin ?? '',
          receiver: existingPm?.receiver ?? null,
        }]
      : [],
  }
}

export function ExpensesSection() {
  const [filters, setFilters] = useState<Record<string, ExpenseFilter>>({})
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  function setColumnFilter(field: string, next: ExpenseFilter | null) {
    setFilters((prev) => {
      const copy = { ...prev }
      if (next) copy[field] = next
      else delete copy[field]
      return copy
    })
  }

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  const { data, isLoading } = useExpenses({
    filters: Object.values(filters),
    sort: sort ? { field: sort.key, direction: sort.dir } : null,
  })
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const del = useDeleteExpense()
  const { date: periodDate } = usePeriod()

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<RowForm>(emptyForm)
  const [editing, setEditing] = useState<{ id: string; field: EditField } | null>(null)
  const [draft, setDraft] = useState<RowForm>(emptyForm)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [pendingEdits, setPendingEdits] = useState<Record<string, ExpenseUpdatePayload>>({})
  const pendingToasts = useRef<Record<string, string | number>>({})

  const expenses = data?.expenses ?? []
  // Rows arrive already sorted from the backend (sort param); we only overlay unsaved edits.
  const sortedExpenses = expenses.map((e) => (pendingEdits[e.id] ? mergePendingExpense(e, pendingEdits[e.id]) : e))
  const isEmpty = !isLoading && !expenses.length && !isAdding

  const { data: categoriesData } = useCategories()
  const categoryNameById = new Map((categoriesData?.categories ?? []).map((c) => [String(c.id), c.name]))
  const usedCategoryIds = new Set(expenses.map((e) => String(e.category_id)))

  function clearPending(id: string) {
    setPendingEdits((prev) => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
    delete pendingToasts.current[id]
  }

  function showSaveToast(id: string, payload: ExpenseUpdatePayload) {
    const prev = pendingToasts.current[id]
    if (prev !== undefined) toast.dismiss(prev)
    const tid = toast.custom((t) => (
      <SaveChangesToast
        t={t}
        successMessage="Expense saved"
        onSave={async () => { await update.mutateAsync(payload); clearPending(id) }}
        onRevert={() => clearPending(id)}
      />
    ), { duration: Infinity })
    pendingToasts.current[id] = tid
  }

  function commitChanges(expense: Expense, form: RowForm) {
    if (!form.name.trim() || !formHasChanges(expense, form)) return
    const payload = buildPayload(expense.id, form, expense)
    setPendingEdits((prev) => ({ ...prev, [expense.id]: payload }))
    showSaveToast(expense.id, payload)
  }

  function startFieldEdit(expense: Expense, field: EditField) {
    setEditing({ id: expense.id, field })
    setDraft(formFromExpense(expense))
  }

  function handleCategoryChange(expenseId: string, categoryId: string) {
    const expense = sortedExpenses.find((e) => e.id === expenseId)
    if (!expense) {
      setEditing(null)
      setDraft(emptyForm)
      return
    }

    const updatedDraft = { ...draft, category_id: categoryId }
    setEditing(null)
    setDraft(emptyForm)
    commitChanges(expense, updatedDraft)
  }

  function handlePaymentMethodChange(expenseId: string, paymentMethodId: string) {
    const expense = sortedExpenses.find((e) => e.id === expenseId)
    if (!expense) {
      setEditing(null)
      setDraft(emptyForm)
      return
    }

    const updatedDraft = { ...draft, payment_method_id: paymentMethodId }
    setEditing(null)
    setDraft(emptyForm)
    commitChanges(expense, updatedDraft)
  }

  function handleFieldBlur(expenseId: string) {
    const expense = sortedExpenses.find((e) => e.id === expenseId)
    if (!expense) {
      setEditing(null)
      setDraft(emptyForm)
      return
    }

    setEditing(null)
    setDraft(emptyForm)
    commitChanges(expense, draft)
  }

  function handleAdd() {
    if (!addForm.name.trim() || !addForm.amount) return
    const amount = parseFloat(addForm.amount)
    create.mutate(
      {
        name: addForm.name.trim(),
        amount,
        category_id: addForm.category_id ? parseInt(addForm.category_id, 10) : null,
        date: addForm.date,
        is_recurring: addForm.is_recurring,
        is_paid: addForm.is_paid,
        is_saved: addForm.is_saved,
        payment_methods: addForm.payment_method_id
          ? [{ payment_method_id: parseInt(addForm.payment_method_id, 10), partial_amount: amount }]
          : [],
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
    <section className="flex flex-col flex-1 min-h-0">
      <div className="border border-green-700 dark:border-green-800 rounded-lg flex flex-col flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 flex-1" role="status" aria-label="Loading">
            <Loader2 className="size-6 animate-spin text-green-600 dark:text-green-400" />
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex items-center justify-center">
            <button
              type="button"
              aria-label="Add expense"
              onClick={() => { setIsAdding(true); setAddForm((f) => ({ ...f, date: periodDate })) }}
              className="w-12 h-12 rounded-full border-2 border-dashed border-green-700 dark:border-green-800 text-green-700 dark:text-green-700 text-2xl flex items-center justify-center hover:border-green-500 dark:hover:border-green-600 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 transition-all duration-150"
            >
              +
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="sheet-table table-fixed w-full">
                <ExpensesTableColgroup />
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-0">
                    <TableHead className="py-4 px-5 h-auto">
                      <ColumnHeader label="Name" sortKey="name" sort={sort} onSort={toggleSort} filter={{ field: 'name', type: 'text', value: filters.name ?? null, onChange: (n) => setColumnFilter('name', n) }} />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto">
                      <ColumnHeader label="Category" />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto">
                      <ColumnHeader label="Amount" align="right" sortKey="amount" sort={sort} onSort={toggleSort} filter={{ field: 'amount', type: 'number', value: filters.amount ?? null, onChange: (n) => setColumnFilter('amount', n) }} />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto">
                      <ColumnHeader label="Payment Method" />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedExpenses.map((expense) => {
                    const isEditing = editing?.id === expense.id
                    return (
                      <TableRow key={expense.id} className="border-0">
                        <TableCell className="py-5 px-5 max-w-0 overflow-hidden">
                          {isEditing && editing.field === 'name' ? (
                            <Input
                              className="min-w-0 text-[1rem]"
                              value={draft.name}
                              onChange={(e) => setDraft((f) => ({ ...f, name: e.target.value }))}
                              onBlur={() => handleFieldBlur(expense.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditing(null)
                                  setDraft(emptyForm)
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <button
                              type="button"
                              className="w-full text-left truncate block hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              title={expense.name}
                              onClick={() => startFieldEdit(expense, 'name')}
                            >
                              {expense.name}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-5 px-5 max-w-0 overflow-hidden">
                          {isEditing && editing.field === 'category' ? (
                            <CategoryCombobox
                              value={draft.category_id}
                              onChange={(v) => handleCategoryChange(expense.id, v)}
                              type="EXPENSE"
                              usedCategoryIds={usedCategoryIds}
                              autoOpen
                            />
                          ) : (
                            <button
                              type="button"
                              className="w-full text-left truncate block text-green-700 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors"
                              title={categoryNameById.get(String(expense.category_id)) ?? undefined}
                              onClick={() => startFieldEdit(expense, 'category')}
                            >
                              {categoryNameById.get(String(expense.category_id)) ?? (
                                <span className="text-green-300 dark:text-green-800">—</span>
                              )}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-5 px-5 text-right">
                          {isEditing && editing.field === 'amount' ? (
                            <Input
                              type="number"
                              className="min-w-0 text-right text-[1rem]"
                              value={draft.amount}
                              onChange={(e) => setDraft((f) => ({ ...f, amount: e.target.value }))}
                              onBlur={() => handleFieldBlur(expense.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditing(null)
                                  setDraft(emptyForm)
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <button
                              type="button"
                              className="w-full text-right font-mono hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              onClick={() => startFieldEdit(expense, 'amount')}
                            >
                              {fmtMoney(expense.period_amount)}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-5 px-5 max-w-0 overflow-hidden">
                          {isEditing && editing.field === 'payment_method' ? (
                            <PaymentMethodCombobox
                              value={draft.payment_method_id}
                              onChange={(v) => handlePaymentMethodChange(expense.id, v)}
                              autoOpen
                            />
                          ) : (
                            <button
                              type="button"
                              className="w-full text-left truncate block text-green-700 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors"
                              title={(expense.payment_methods ?? []).map((pm) => pm.origin ? `${pm.name} (${pm.origin})` : pm.name).join(', ') || undefined}
                              onClick={() => startFieldEdit(expense, 'payment_method')}
                            >
                              {(expense.payment_methods ?? []).length > 0
                                ? (expense.payment_methods ?? []).map((pm, i) => (
                                    <span key={pm.payment_method_id}>
                                      {i > 0 ? ', ' : ''}{pm.name}
                                      {pm.origin ? (
                                        <span className="text-xs text-green-400/70 dark:text-[#86efac]/50"> ({pm.origin})</span>
                                      ) : null}
                                    </span>
                                  ))
                                : <span className="text-green-300 dark:text-green-800">—</span>
                              }
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-5 px-5 text-right flex items-center justify-end gap-2">
                          <ExpenseExtraTools expense={expense} draft={draft} onDraftChange={setDraft} onUpdate={(updates) => update.mutate(updates)} />
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setDeletingExpenseId(expense.id)
                              del.mutate(expense.id, { onSettled: () => setDeletingExpenseId(null) })
                            }}
                            disabled={del.isPending}
                            aria-label="Delete expense"
                          >
                            {deletingExpenseId === expense.id ? <Loader2 className="animate-spin" /> : '✕'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {isAdding && (
                    <TableRow className="add-row border-0">
                      <TableCell className="py-5 px-5">
                        <Input
                          className="min-w-0 text-[1rem]"
                          placeholder="Work"
                          value={addForm.name}
                          onChange={(e) =>
                            setAddForm((f) => ({ ...f, name: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAdd()
                            if (e.key === 'Escape') { setIsAdding(false); setAddForm(emptyForm) }
                          }}
                          autoFocus
                        />
                      </TableCell>
                      <TableCell className="py-5 px-5">
                        <CategoryCombobox
                          value={addForm.category_id}
                          onChange={(v) => setAddForm((f) => ({ ...f, category_id: v }))}
                          type="EXPENSE"
                          usedCategoryIds={usedCategoryIds}
                          autoOpen={false}
                        />
                      </TableCell>
                      <TableCell className="py-5 px-5">
                        <Input
                          type="number"
                          className="min-w-0 text-right text-[1rem]"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={addForm.amount}
                          onChange={(e) =>
                            setAddForm((f) => ({ ...f, amount: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                      </TableCell>
                      <TableCell className="py-5 px-5">
                        <PaymentMethodCombobox
                          value={addForm.payment_method_id}
                          onChange={(v) => setAddForm((f) => ({ ...f, payment_method_id: v }))}
                        />
                      </TableCell>
                      <TableCell className="py-5 px-5 text-right">
                        <div className="flex gap-2 items-center justify-end">
                          {addForm.name.trim() && addForm.amount && (
                            <Button size="default" onClick={handleAdd}>
                              Save
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => { setIsAdding(false); setAddForm(emptyForm) }}
                            aria-label="Cancel"
                          >
                            ✕
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isAdding && expenses.length > 0 && (
                    <TableRow
                      className="border-0 cursor-pointer group add-hint"
                      onClick={() => { setIsAdding(true); setAddForm((f) => ({ ...f, date: periodDate })) }}
                      aria-label="Add expense"
                    >
                      <TableCell
                        colSpan={5}
                        className="py-3 px-5 text-center text-green-400/60 dark:text-green-700 select-none group-hover:text-green-600 dark:group-hover:text-green-500 transition-colors"
                      >
                        <span className="text-xl leading-none font-light" aria-hidden="true">+</span>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </table>
            </div>
            {expenses.length > 0 && (
              <table className="sheet-table table-fixed w-full shrink-0">
                <ExpensesTableColgroup />
              </table>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function ExpenseExtraTools({
  expense,
  draft,
  onDraftChange,
  onUpdate,
}: {
  expense: Expense
  draft: RowForm
  onDraftChange: (form: RowForm) => void
  onUpdate: (updates: { id: string; date: string; is_paid: boolean; is_saved: boolean }) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="border-white text-white hover:bg-white/10">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="bg-white dark:bg-[#0f1a0f] border border-green-100 dark:border-[#166534] p-4 w-64">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <Input
              type="date"
              value={draft.date}
              onChange={(e) => onDraftChange({ ...draft, date: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_paid"
              checked={draft.is_paid}
              onCheckedChange={(checked) => onDraftChange({ ...draft, is_paid: Boolean(checked) })}
            />
            <label htmlFor="is_paid" className="text-sm font-medium cursor-pointer">
              Paid
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_saved"
              checked={draft.is_saved}
              onCheckedChange={(checked) => onDraftChange({ ...draft, is_saved: Boolean(checked) })}
            />
            <label htmlFor="is_saved" className="text-sm font-medium cursor-pointer">
              Saved
            </label>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onUpdate({
                id: expense.id,
                date: draft.date,
                is_paid: draft.is_paid,
                is_saved: draft.is_saved,
              })
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
