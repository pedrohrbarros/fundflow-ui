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
import { usePaymentMethods } from '@/hooks/use-payment-methods'
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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { XIcon } from 'lucide-react'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface PmEntry {
  payment_method_id: string
  partial_amount: string
}

interface RowForm {
  name: string
  amount: string
  category_id: string
  is_paid: boolean
  is_saved: boolean
  payment_methods: PmEntry[]
  date: string
  is_recurring: boolean
  recurring_months: string
}

type EditField = 'name' | 'category' | 'amount' | 'date' | 'recurring_months'

type ExpenseUpdatePayload = {
  id: string
  name: string
  category_id: number | null
  amount: number
  date: string
  is_recurring: boolean
  recurring_months: number | null
  is_paid: boolean
  is_saved: boolean
  payment_methods?: { payment_method_id: number; partial_amount: number }[]
}

const emptyForm: RowForm = {
  name: '',
  amount: '',
  category_id: '',
  is_paid: false,
  is_saved: false,
  payment_methods: [],
  date: '',
  is_recurring: false,
  recurring_months: '',
}

function ExpensesTableColgroup() {
  return (
    <colgroup>
      <col style={{ width: '25%' }} />
      <col style={{ width: '11%' }} />
      <col style={{ width: '11%' }} />
      <col style={{ width: '16%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '9%' }} />
    </colgroup>
  )
}

function remainingMonths(expense: { date: string; recurring_months: number | null }, periodDate: string): number | null {
  if (expense.recurring_months == null) return null
  const [ey, em] = expense.date.split('-').map(Number)
  const [py, pm] = periodDate.split('-').map(Number)
  const monthsDiff = (py - ey) * 12 + (pm - em)
  return Math.max(0, expense.recurring_months - monthsDiff)
}

function formFromExpense(expense: Expense): RowForm {
  return {
    name: expense.name,
    amount: String(expense.amount),
    category_id: String(expense.category_id ?? ''),
    is_paid: expense.is_paid,
    is_saved: expense.is_saved,
    payment_methods: expense.payment_methods.map((pm) => ({
      payment_method_id: pm.payment_method_id,
      partial_amount: String(pm.partial_amount),
    })),
    date: expense.date,
    is_recurring: expense.is_recurring,
    recurring_months: expense.recurring_months != null ? String(expense.recurring_months) : '',
  }
}

function pmChanged(expense: Expense, form: RowForm): boolean {
  const formPMIds = form.payment_methods.map((pm) => String(pm.payment_method_id)).sort().join(',')
  const expensePMIds = expense.payment_methods.map((pm) => String(pm.payment_method_id)).sort().join(',')
  if (formPMIds !== expensePMIds) return true
  return form.payment_methods.some((fpm) => {
    const epm = expense.payment_methods.find((e) => String(e.payment_method_id) === String(fpm.payment_method_id))
    return !epm || Math.abs((parseFloat(fpm.partial_amount) || 0) - epm.partial_amount) > 0.001
  })
}

function formHasChanges(expense: Expense, form: RowForm) {
  const amount = parseFloat(form.amount) || 0
  const formRecurringMonths = form.is_recurring ? (parseInt(form.recurring_months, 10) || null) : null

  return (
    form.name.trim() !== expense.name ||
    String(expense.category_id ?? '') !== form.category_id ||
    amount !== expense.amount ||
    form.date !== expense.date ||
    form.is_recurring !== expense.is_recurring ||
    formRecurringMonths !== expense.recurring_months ||
    form.is_paid !== expense.is_paid ||
    form.is_saved !== expense.is_saved ||
    pmChanged(expense, form)
  )
}

function buildPayload(id: string, form: RowForm, expense: Expense): ExpenseUpdatePayload {
  const amount = parseFloat(form.amount) || 0
  const pmsChanged = pmChanged(expense, form)
  return {
    id,
    name: form.name.trim(),
    amount,
    category_id: form.category_id ? parseInt(form.category_id, 10) : null,
    date: form.date,
    is_recurring: form.is_recurring,
    recurring_months: form.is_recurring ? (parseInt(form.recurring_months, 10) || null) : null,
    is_paid: form.is_paid,
    is_saved: form.is_saved,
    ...(pmsChanged ? {
      payment_methods: form.payment_methods
        .filter((pm) => pm.payment_method_id)
        .map((pm) => ({
          payment_method_id: parseInt(String(pm.payment_method_id), 10),
          partial_amount: parseFloat(pm.partial_amount) || 0,
        })),
    } : {}),
  }
}

function mergePendingExpense(expense: Expense, payload: ExpenseUpdatePayload): Expense {
  const pmMap = new Map(expense.payment_methods.map((pm) => [String(pm.payment_method_id), pm]))
  return {
    ...expense,
    name: payload.name,
    amount: payload.amount,
    period_amount: payload.amount,
    category_id: payload.category_id == null ? null : String(payload.category_id),
    date: payload.date,
    is_recurring: payload.is_recurring,
    recurring_months: payload.recurring_months,
    is_paid: payload.is_paid,
    is_saved: payload.is_saved,
    payment_methods: (payload.payment_methods ?? expense.payment_methods.map((pm) => ({ ...pm, payment_method_id: pm.payment_method_id }))).map((pm) => {
      const existing = pmMap.get(String(pm.payment_method_id))
      return {
        payment_method_id: String(pm.payment_method_id),
        partial_amount: pm.partial_amount,
        name: existing?.name ?? '',
        origin: existing?.origin ?? '',
        receiver: existing?.receiver ?? null,
      }
    }),
  }
}

const PAGE_LIMIT = 100

export function ExpensesSection() {
  const [filters, setFilters] = useState<Record<string, ExpenseFilter>>({})
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>({ key: 'amount', dir: 'desc' })
  const [page, setPage] = useState(1)

  function setColumnFilter(field: string, next: ExpenseFilter | null) {
    setFilters((prev) => {
      const copy = { ...prev }
      if (next) copy[field] = next
      else delete copy[field]
      return copy
    })
    setPage(1)
  }

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
    setPage(1)
  }

  const { data, isLoading } = useExpenses({
    filters: Object.values(filters),
    sort: sort ? { field: sort.key, direction: sort.dir } : null,
    limit: PAGE_LIMIT,
    page,
  })
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const del = useDeleteExpense()
  const { date: periodDate } = usePeriod()

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<RowForm>(emptyForm)
  const [addFormShowPmPicker, setAddFormShowPmPicker] = useState(false)
  const [editing, setEditing] = useState<{ id: string; field: EditField } | null>(null)
  const [draft, setDraft] = useState<RowForm>(emptyForm)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [pendingEdits, setPendingEdits] = useState<Record<string, ExpenseUpdatePayload>>({})
  const sharedToastId = useRef<string | number | undefined>(undefined)
  // Mobile-only: tap a row (or add) to edit all fields in one modal.
  const [rowForm, setRowForm] = useState<{ mode: 'add' } | { mode: 'edit'; expense: Expense } | null>(null)

  const expenses = data?.expenses ?? []
  const sortedExpenses = expenses.map((e) => (pendingEdits[e.id] ? mergePendingExpense(e, pendingEdits[e.id]) : e))
  const isEmpty = !isLoading && !expenses.length && !isAdding

  const { data: categoriesData } = useCategories()
  const categoryNameById = new Map((categoriesData?.categories ?? []).map((c) => [String(c.id), c.name]))
  const usedCategoryIds = new Set(expenses.map((e) => String(e.category_id)))

  function clearAllPending() {
    setPendingEdits({})
    if (sharedToastId.current !== undefined) {
      toast.dismiss(sharedToastId.current)
      sharedToastId.current = undefined
    }
    setDraft(emptyForm)
    setEditing(null)
  }

  function showSharedToast(payloads: ExpenseUpdatePayload[]) {
    if (sharedToastId.current !== undefined) toast.dismiss(sharedToastId.current)
    const count = payloads.length
    const tid = toast.custom((t) => (
      <SaveChangesToast
        t={t}
        successMessage={count === 1 ? 'Expense saved' : `${count} expenses saved`}
        onSave={async () => {
          await Promise.all(payloads.map((p) => update.mutateAsync(p)))
          clearAllPending()
        }}
        onRevert={() => clearAllPending()}
      />
    ), { duration: Infinity })
    sharedToastId.current = tid
  }

  function commitChanges(expense: Expense, form: RowForm) {
    if (!form.name.trim() || !formHasChanges(expense, form)) return
    const payload = buildPayload(expense.id, form, expense)
    const nextPending = { ...pendingEdits, [expense.id]: payload }
    setPendingEdits(nextPending)
    showSharedToast(Object.values(nextPending))
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
        recurring_months: addForm.is_recurring ? (parseInt(addForm.recurring_months, 10) || null) : null,
        is_paid: addForm.is_paid,
        is_saved: addForm.is_saved,
        payment_methods: addForm.payment_methods
          .filter((pm) => pm.payment_method_id)
          .map((pm) => ({
            payment_method_id: parseInt(pm.payment_method_id, 10),
            partial_amount: parseFloat(pm.partial_amount) || amount,
          })),
      },
      {
        onSuccess: () => {
          setAddForm(emptyForm)
          setIsAdding(false)
          setAddFormShowPmPicker(false)
        },
      }
    )
  }

  function submitRowForm(form: RowForm) {
    if (rowForm?.mode === 'edit') {
      commitChanges(rowForm.expense, form)
      setRowForm(null)
    } else {
      if (!form.name.trim() || !form.amount) return
      const amount = parseFloat(form.amount)
      create.mutate(
        {
          name: form.name.trim(),
          amount,
          category_id: form.category_id ? parseInt(form.category_id, 10) : null,
          date: form.date || periodDate,
          is_recurring: form.is_recurring,
          recurring_months: form.is_recurring ? (parseInt(form.recurring_months, 10) || null) : null,
          is_paid: form.is_paid,
          is_saved: form.is_saved,
          payment_methods: form.payment_methods
            .filter((pm) => pm.payment_method_id)
            .map((pm) => ({
              payment_method_id: parseInt(pm.payment_method_id, 10),
              partial_amount: parseFloat(pm.partial_amount) || amount,
            })),
        },
        { onSuccess: () => setRowForm(null) },
      )
    }
  }

  return (
    <>
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
            {/* Mobile: full-width name + amount list (tap a row to edit) */}
            <div className="sm:hidden flex-1 min-h-0 overflow-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[#166534] px-4 py-3 text-sm font-semibold text-white">
                <span>Name</span>
                <span>Amount</span>
              </div>
              {sortedExpenses.map((expense) => (
                <button
                  key={expense.id}
                  type="button"
                  onClick={() => setRowForm({ mode: 'edit', expense })}
                  className="w-full flex items-center justify-between gap-3 border-b border-green-100 dark:border-green-800 px-4 py-3 text-left active:bg-green-50 dark:active:bg-green-950/40 transition-colors"
                >
                  <span className="min-w-0 truncate text-gray-900 dark:text-[#d1fae5]">{expense.name}</span>
                  <span className="shrink-0 font-mono text-gray-900 dark:text-[#d1fae5]">{fmtMoney(expense.period_amount)}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRowForm({ mode: 'add' })}
                className="w-full px-4 py-3 text-center text-green-700 dark:text-green-500 font-medium active:bg-green-50 dark:active:bg-green-950/40 transition-colors"
              >
                + Add expense
              </button>
            </div>

            {/* Desktop: full editable table */}
            <div className="hidden sm:block flex-1 min-h-0 overflow-auto">
              <table className="sheet-table table-fixed w-full">
                <ExpensesTableColgroup />
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-0">
                    <TableHead className="py-4 px-5 h-auto">
                      <ColumnHeader label="Name" sortKey="name" sort={sort} onSort={toggleSort} filter={{ field: 'name', type: 'text', value: filters.name ?? null, onChange: (n) => setColumnFilter('name', n) }} />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto hidden sm:table-cell">
                      <ColumnHeader label="Category" />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto">
                      <ColumnHeader label="Amount" align="right" sortKey="amount" sort={sort} onSort={toggleSort} filter={{ field: 'amount', type: 'number', value: filters.amount ?? null, onChange: (n) => setColumnFilter('amount', n) }} />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto hidden sm:table-cell">
                      <ColumnHeader label="Payment Method" />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto hidden sm:table-cell">
                      <ColumnHeader label="Paid" align="center" sortKey="is_paid" sort={sort} onSort={toggleSort} />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto text-center hidden sm:table-cell">
                      <ColumnHeader label="Recurring" align="center" sortKey="is_recurring" sort={sort} onSort={toggleSort} />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto hidden sm:table-cell">
                      <ColumnHeader label="Remaining" align="center" />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto text-right hidden sm:table-cell" />
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
                        <TableCell className="py-5 px-5 max-w-0 overflow-hidden hidden sm:table-cell">
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
                        <TableCell className="py-5 px-5 max-w-0 overflow-hidden hidden sm:table-cell">
                          <ExpensePmEditCell
                            expense={expense}
                            onSave={(pms) => {
                              const merged = { ...formFromExpense(expense), payment_methods: pms }
                              commitChanges(expense, merged)
                            }}
                          />
                        </TableCell>
                        <TableCell className="py-5 px-5 text-center hidden sm:table-cell">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={expense.is_paid}
                              onCheckedChange={(checked) => {
                                const merged = { ...formFromExpense(expense), is_paid: Boolean(checked) }
                                commitChanges(expense, merged)
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-5 text-center hidden sm:table-cell">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={expense.is_recurring}
                              onCheckedChange={(checked) => {
                                const merged = { ...formFromExpense(expense), is_recurring: Boolean(checked), recurring_months: Boolean(checked) ? formFromExpense(expense).recurring_months : '' }
                                commitChanges(expense, merged)
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-5 text-center hidden sm:table-cell">
                          {expense.is_recurring && (
                            isEditing && editing.field === 'recurring_months' ? (
                              <Input
                                type="number"
                                className="w-16 text-center text-sm"
                                min="1"
                                placeholder="∞"
                                value={draft.recurring_months}
                                onChange={(e) => setDraft((f) => ({ ...f, recurring_months: e.target.value }))}
                                onBlur={() => handleFieldBlur(expense.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') { setEditing(null); setDraft(emptyForm) }
                                }}
                                autoFocus
                              />
                            ) : (
                              <button
                                type="button"
                                className="font-mono text-sm hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                onClick={() => startFieldEdit(expense, 'recurring_months')}
                              >
                                {expense.recurring_months != null ? `${remainingMonths(expense, periodDate)}mo` : '∞'}
                              </button>
                            )
                          )}
                        </TableCell>
                        <TableCell className="py-5 px-5 text-right hidden sm:flex items-center justify-end gap-2">
                          <ExpenseExtraTools expense={expense} onUpdate={(updates) => {
                            const merged = { ...formFromExpense(expense), ...updates }
                            commitChanges(expense, merged)
                          }} />
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
                            if (e.key === 'Escape') { setIsAdding(false); setAddForm(emptyForm); setAddFormShowPmPicker(false) }
                          }}
                          autoFocus
                        />
                      </TableCell>
                      <TableCell className="py-5 px-5 hidden sm:table-cell">
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
                      <TableCell className="py-5 px-5 hidden sm:table-cell">
                        <div className="flex flex-col gap-0.5">
                          {addForm.payment_methods.map((pm, i) => (
                            <AddFormPmRow
                              key={pm.payment_method_id}
                              pmId={pm.payment_method_id}
                              partialAmount={pm.partial_amount}
                              showAdd={i === addForm.payment_methods.length - 1 && !addFormShowPmPicker}
                              onAdd={() => setAddFormShowPmPicker(true)}
                              onAmountChange={(val) =>
                                setAddForm((f) => ({
                                  ...f,
                                  payment_methods: f.payment_methods.map((p, j) =>
                                    j === i ? { ...p, partial_amount: val } : p
                                  ),
                                }))
                              }
                              onRemove={() =>
                                setAddForm((f) => ({
                                  ...f,
                                  payment_methods: f.payment_methods.filter((_, j) => j !== i),
                                }))
                              }
                            />
                          ))}
                          {(addForm.payment_methods.length === 0 || addFormShowPmPicker) && (
                            <PaymentMethodCombobox
                              value=""
                              onChange={(id) => {
                                if (!id || addForm.payment_methods.some((pm) => pm.payment_method_id === id)) return
                                setAddForm((f) => ({
                                  ...f,
                                  payment_methods: [...f.payment_methods, { payment_method_id: id, partial_amount: '' }],
                                }))
                                setAddFormShowPmPicker(false)
                              }}
                              placeholder="Add payment method"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-5 text-center hidden sm:table-cell">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={addForm.is_paid}
                            onCheckedChange={(checked) => setAddForm((f) => ({ ...f, is_paid: Boolean(checked) }))}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-5 text-center hidden sm:table-cell">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={addForm.is_recurring}
                            onCheckedChange={(checked) => setAddForm((f) => ({ ...f, is_recurring: Boolean(checked), recurring_months: Boolean(checked) ? f.recurring_months : '' }))}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-5 text-center hidden sm:table-cell">
                        {addForm.is_recurring && (
                          <Input
                            type="number"
                            className="w-16 text-center text-sm"
                            min="1"
                            placeholder="∞"
                            value={addForm.recurring_months}
                            onChange={(e) => setAddForm((f) => ({ ...f, recurring_months: e.target.value }))}
                            title="Recurring months limit"
                          />
                        )}
                      </TableCell>
                      <TableCell className="py-5 px-5 text-right hidden sm:table-cell">
                        <div className="flex gap-2 items-center justify-end">
                          {addForm.name.trim() && addForm.amount && (
                            <Button size="default" onClick={handleAdd}>
                              Save
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => { setIsAdding(false); setAddForm(emptyForm); setAddFormShowPmPicker(false) }}
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
                        colSpan={8}
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
              <table className="sheet-table table-fixed w-full shrink-0 hidden sm:table">
                <ExpensesTableColgroup />
              </table>
            )}
            {data && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-green-700 dark:border-green-800 shrink-0">
                <span className="text-xs text-green-600 dark:text-green-500">
                  {data.pagination.total === 0
                    ? '0 expenses'
                    : `${(page - 1) * PAGE_LIMIT + 1}–${Math.min(page * PAGE_LIMIT, data.pagination.total)} of ${data.pagination.total}`}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="xs"
                    className="text-gray-900 dark:text-white"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ‹ Prev
                  </Button>
                  <span className="text-xs text-green-600 dark:text-green-500 px-2">
                    {page} / {Math.max(1, Math.ceil(data.pagination.total / PAGE_LIMIT))}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    className="text-gray-900 dark:text-white"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * PAGE_LIMIT >= data.pagination.total}
                  >
                    Next ›
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>

    {rowForm && (
      <ExpenseRowFormModal
        mode={rowForm.mode}
        expense={rowForm.mode === 'edit' ? rowForm.expense : null}
        usedCategoryIds={usedCategoryIds}
        periodDate={periodDate}
        isSaving={create.isPending}
        onDelete={
          rowForm.mode === 'edit'
            ? () => {
                const id = (rowForm as { expense: Expense }).expense.id
                setDeletingExpenseId(id)
                del.mutate(id, { onSettled: () => setDeletingExpenseId(null) })
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

function ExpenseRowFormModal({
  mode,
  expense,
  usedCategoryIds,
  periodDate,
  isSaving,
  onDelete,
  onClose,
  onSubmit,
}: {
  mode: 'add' | 'edit'
  expense: Expense | null
  usedCategoryIds: Set<string>
  periodDate: string
  isSaving: boolean
  onDelete?: () => void
  onClose: () => void
  onSubmit: (form: RowForm) => void
}) {
  const [form, setForm] = useState<RowForm>(
    expense ? formFromExpense(expense) : { ...emptyForm, date: periodDate },
  )

  const canSave = form.name.trim().length > 0 && !!form.amount

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent
        className="w-[min(94vw,26rem)] bg-white dark:bg-[#0f1a0f] ring-green-700 dark:ring-[#166534] text-gray-900 dark:text-[#d1fae5]"
        showCloseButton={false}
      >
        {/* Mobile-only close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="sm:hidden absolute top-2 right-2 p-1.5 rounded-md text-gray-600 dark:text-[#86efac] hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <DialogTitle>{mode === 'add' ? 'Add expense' : 'Edit expense'}</DialogTitle>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Expense name"
              className="w-full bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <CategoryCombobox
              value={form.category_id}
              onChange={(id) => setForm((f) => ({ ...f, category_id: id }))}
              type="EXPENSE"
              usedCategoryIds={usedCategoryIds}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Amount</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className="w-full text-right bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
            />
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

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="expense_row_paid"
                checked={form.is_paid}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_paid: Boolean(checked) }))}
              />
              <label htmlFor="expense_row_paid" className="text-sm font-medium cursor-pointer">Paid</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="expense_row_recurring"
                checked={form.is_recurring}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_recurring: Boolean(checked), recurring_months: Boolean(checked) ? f.recurring_months : '' }))}
              />
              <label htmlFor="expense_row_recurring" className="text-sm font-medium cursor-pointer">Recurring</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="expense_row_saved"
                checked={form.is_saved}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_saved: Boolean(checked) }))}
              />
              <label htmlFor="expense_row_saved" className="text-sm font-medium cursor-pointer">Saved</label>
            </div>
          </div>

          {form.is_recurring && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Recurring months limit</label>
              <Input
                type="number"
                min="1"
                placeholder="Indefinite"
                value={form.recurring_months}
                onChange={(e) => setForm((f) => ({ ...f, recurring_months: e.target.value }))}
                className="w-full bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
              />
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button className="w-full" disabled={!canSave || isSaving} onClick={() => onSubmit(form)}>
              {isSaving ? <Loader2 className="animate-spin" /> : 'Save'}
            </Button>
            {mode === 'edit' && onDelete && (
              <Button variant="destructive" className="w-full" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddFormPmRow({
  pmId,
  partialAmount,
  onAmountChange,
  onRemove,
  showAdd,
  onAdd,
}: {
  pmId: string
  partialAmount: string
  onAmountChange: (val: string) => void
  onRemove: () => void
  showAdd?: boolean
  onAdd?: () => void
}) {
  const { data } = usePaymentMethods()
  const pm = data?.payment_methods.find((p) => String(p.id) === pmId)
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="flex-1 truncate text-green-700 dark:text-green-400">{pm?.name ?? pmId}</span>
      <Input
        type="number"
        className="w-16 h-5 text-xs text-right px-1 py-0"
        min="0"
        step="0.01"
        placeholder="amt"
        value={partialAmount}
        onChange={(e) => onAmountChange(e.target.value)}
      />
      <button
        type="button"
        className="text-red-400 hover:text-red-300 shrink-0"
        onClick={onRemove}
        aria-label="Remove"
      >
        ✕
      </button>
      {showAdd && (
        <button
          type="button"
          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 shrink-0 font-medium"
          onClick={onAdd}
          aria-label="Add payment method"
        >
          +
        </button>
      )}
    </div>
  )
}

function ExpensePmEditCell({
  expense,
  onSave,
}: {
  expense: Expense
  onSave: (pms: PmEntry[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [localPms, setLocalPms] = useState<PmEntry[]>([])
  const { data: pmData } = usePaymentMethods()
  const paymentMethods = pmData?.payment_methods ?? []

  const displayPms = expense.payment_methods ?? []

  return (
    <Popover open={open} onOpenChange={(o) => {
      if (o) {
        setLocalPms(displayPms.map((pm) => ({
          payment_method_id: pm.payment_method_id,
          partial_amount: String(pm.partial_amount),
        })))
      }
      setOpen(o)
    }}>
      <PopoverTrigger
        className="w-full text-left truncate text-green-700 dark:text-green-400 text-sm hover:text-green-600 dark:hover:text-green-300 transition-colors block"
        title={displayPms.map((pm) => pm.origin ? `${pm.name} (${pm.origin})` : pm.name).join(', ') || undefined}
      >
        {displayPms.length > 0
          ? displayPms.map((pm, i) => (
              <span key={pm.payment_method_id}>
                {i > 0 ? ', ' : ''}{pm.name}
                {pm.origin ? <span className="text-xs text-green-400/70 dark:text-[#86efac]/50"> ({pm.origin})</span> : null}
              </span>
            ))
          : <span className="text-green-300 dark:text-green-800">—</span>
        }
      </PopoverTrigger>
      <PopoverContent align="start" className="bg-white dark:bg-[#0f1a0f] border border-green-100 dark:border-[#166534] p-4 w-72 text-gray-900 dark:text-[#d1fae5]">
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            {localPms.map((pm, i) => {
              const meta = paymentMethods.find((p) => String(p.id) === String(pm.payment_method_id))
              return (
                <div key={pm.payment_method_id} className="flex items-center gap-1">
                  <span className="flex-1 text-xs truncate text-green-800 dark:text-[#d1fae5]">
                    {meta?.name ?? pm.payment_method_id}
                    {meta?.origin ? <span className="text-green-500 dark:text-[#86efac]/60"> ({meta.origin})</span> : null}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="amt"
                    value={pm.partial_amount}
                    onChange={(e) =>
                      setLocalPms((prev) => prev.map((p, j) => j === i ? { ...p, partial_amount: e.target.value } : p))
                    }
                    className="w-20 h-6 text-xs text-right px-1.5 bg-green-50 dark:bg-[#1a2e1a] border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
                  />
                  <button
                    type="button"
                    className="shrink-0 text-red-400 hover:text-red-300 text-xs px-1"
                    onClick={() => setLocalPms((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Remove payment method"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
          <PaymentMethodCombobox
            value=""
            onChange={(id) => {
              if (!id || localPms.some((pm) => pm.payment_method_id === id)) return
              setLocalPms((prev) => [...prev, { payment_method_id: id, partial_amount: '' }])
            }}
            placeholder="Add payment method"
          />
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onSave(localPms)
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

function ExpenseExtraTools({
  expense,
  onUpdate,
}: {
  expense: Expense
  onUpdate: (updates: {
    date: string
    is_saved: boolean
    recurring_months: string
  }) => void
}) {
  const [open, setOpen] = useState(false)
  const [localDraft, setLocalDraft] = useState({
    date: expense.date,
    is_saved: expense.is_saved,
    recurring_months: expense.recurring_months != null ? String(expense.recurring_months) : '',
  })

  function handleOpen(o: boolean) {
    if (o) {
      setLocalDraft({
        date: expense.date,
        is_saved: expense.is_saved,
        recurring_months: expense.recurring_months != null ? String(expense.recurring_months) : '',
      })
    }
    setOpen(o)
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger className="inline-flex items-center justify-center rounded-md border border-gray-400 dark:border-white text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors px-2.5 py-1.5">
        <MoreVertical className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="bg-white dark:bg-[#0f1a0f] border border-green-100 dark:border-[#166534] p-4 w-72 text-gray-900 dark:text-[#d1fae5]">
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
          {expense.is_recurring && (
            <div>
              <label className="block text-sm font-medium mb-2">Recurring months limit</label>
              <Input
                type="number"
                min="1"
                placeholder="Indefinite"
                value={localDraft.recurring_months}
                onChange={(e) => setLocalDraft((f) => ({ ...f, recurring_months: e.target.value }))}
                className="w-full bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id={`is_saved_${expense.id}`}
              checked={localDraft.is_saved}
              onCheckedChange={(checked) => setLocalDraft((f) => ({ ...f, is_saved: Boolean(checked) }))}
            />
            <label htmlFor={`is_saved_${expense.id}`} className="text-sm font-medium cursor-pointer">
              Saved
            </label>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onUpdate({
                date: localDraft.date,
                is_saved: localDraft.is_saved,
                recurring_months: localDraft.recurring_months,
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
