'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
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

type ExpenseUpdatePayload = {
  id: string
  name: string
  category_id: number | null
  amount: number
  date: string
  is_recurring: boolean
  recurring_months: number | null
  is_paid: boolean
  paid_period?: string | null
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
      <col style={{ width: '32%' }} />
      <col style={{ width: '16%' }} />
      <col style={{ width: '14%' }} />
      <col style={{ width: '22%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '8%' }} />
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

function buildPayload(id: string, form: RowForm, expense: Expense, periodDate: string): ExpenseUpdatePayload {
  const amount = parseFloat(form.amount) || 0
  const pmsChanged = pmChanged(expense, form)
  const nextIsRecurring = form.is_recurring
  return {
    id,
    name: form.name.trim(),
    amount,
    category_id: form.category_id ? parseInt(form.category_id, 10) : null,
    date: form.date,
    is_recurring: nextIsRecurring,
    recurring_months: nextIsRecurring ? (parseInt(form.recurring_months, 10) || null) : null,
    is_paid: form.is_paid,
    paid_period: nextIsRecurring ? (form.is_paid ? periodDate.slice(0, 7) : null) : undefined,
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
const AUTO_SAVE_DELAY_MS = 2500

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

  const [pendingEdits, setPendingEdits] = useState<Record<string, ExpenseUpdatePayload>>({})
  const sharedToastId = useRef<string | number | undefined>(undefined)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Every field of an expense is edited in one modal — opened by clicking a
  // row (or the add affordance). The table only keeps the quick checkboxes.
  const [rowForm, setRowForm] = useState<{ mode: 'add' } | { mode: 'edit'; expense: Expense } | null>(null)

  const expenses = data?.expenses ?? []
  const sortedExpenses = expenses.map((e) => (pendingEdits[e.id] ? mergePendingExpense(e, pendingEdits[e.id]) : e))
  const isEmpty = !isLoading && !expenses.length

  const { data: categoriesData } = useCategories()
  const categoryNameById = new Map((categoriesData?.categories ?? []).map((c) => [String(c.id), c.name]))
  const usedCategoryIds = new Set(expenses.map((e) => String(e.category_id)))

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current !== undefined) clearTimeout(autoSaveTimer.current)
    }
  }, [])

  function clearAutoSaveTimer() {
    if (autoSaveTimer.current !== undefined) {
      clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = undefined
    }
  }

  function clearAllPending() {
    clearAutoSaveTimer()
    setPendingEdits({})
    if (sharedToastId.current !== undefined) {
      toast.dismiss(sharedToastId.current)
      sharedToastId.current = undefined
    }
  }

  async function performSave(payloads: ExpenseUpdatePayload[]) {
    await Promise.all(payloads.map((p) => update.mutateAsync(p)))
    clearAllPending()
  }

  function showSharedToast(payloads: ExpenseUpdatePayload[]) {
    if (sharedToastId.current !== undefined) toast.dismiss(sharedToastId.current)
    const count = payloads.length
    const tid = toast.custom((t) => (
      <SaveChangesToast
        t={t}
        successMessage={count === 1 ? 'Expense saved' : `${count} expenses saved`}
        onSave={async () => {
          clearAutoSaveTimer()
          await performSave(payloads)
        }}
        onRevert={() => clearAllPending()}
      />
    ), { duration: Infinity })
    sharedToastId.current = tid

    // Debounce: keep pushing the auto-save out while the user keeps editing;
    // once they pause, persist everything pending without needing a click.
    clearAutoSaveTimer()
    autoSaveTimer.current = setTimeout(() => {
      autoSaveTimer.current = undefined
      performSave(payloads).catch(() => toast.error('Failed to save changes'))
    }, AUTO_SAVE_DELAY_MS)
  }

  function commitChanges(expense: Expense, form: RowForm) {
    if (!form.name.trim() || !formHasChanges(expense, form)) return
    const payload = buildPayload(expense.id, form, expense, periodDate)
    const nextPending = { ...pendingEdits, [expense.id]: payload }
    setPendingEdits(nextPending)
    showSharedToast(Object.values(nextPending))
  }

  // Checkbox columns are drafts like any other field: queue the change and
  // let the shared toast's Save/auto-save timer persist it. `expense` here is
  // already the pending-merged display row, so this layers on top correctly.
  function toggleCheckboxColumn(
    expense: Expense,
    patch: Partial<Pick<RowForm, 'is_paid' | 'is_recurring' | 'recurring_months'>>,
  ) {
    const merged = { ...formFromExpense(expense), ...patch }
    commitChanges(expense, merged)
  }

  function submitRowForm(form: RowForm) {
    if (rowForm?.mode === 'edit') {
      // Auto-save edit without toaster: directly mutate instead of commitChanges
      const payload = buildPayload(rowForm.expense.id, form, rowForm.expense, periodDate)
      update.mutate(payload, {
        onSuccess: () => {
          setRowForm(null)
        },
      })
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
      <div className="border border-border rounded-xl bg-card shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 flex-1" role="status" aria-label="Loading">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex items-center justify-center">
            <button
              type="button"
              aria-label="Add expense"
              onClick={() => setRowForm({ mode: 'add' })}
              className="w-12 h-12 rounded-full border-2 border-dashed border-border text-muted-foreground text-2xl flex items-center justify-center hover:border-primary hover:text-primary hover:bg-accent transition-all duration-150 motion-reduce:transition-none"
            >
              +
            </button>
          </div>
        ) : (
          <>
            {/* Mobile: full-width name + amount list (tap a row to edit) */}
            <div className="sm:hidden flex-1 min-h-0 overflow-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Name</span>
                <span>Amount</span>
              </div>
              {sortedExpenses.map((expense) => (
                <button
                  key={expense.id}
                  type="button"
                  onClick={() => setRowForm({ mode: 'edit', expense })}
                  className="w-full flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-left active:bg-accent transition-colors motion-reduce:transition-none"
                >
                  <span className="min-w-0 truncate text-foreground">{expense.name}</span>
                  <span className="shrink-0 tabular-nums text-foreground">{fmtMoney(expense.period_amount)}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRowForm({ mode: 'add' })}
                className="w-full px-4 py-3 sm:py-3 pb-16 sm:pb-0 text-center text-primary font-medium active:bg-accent transition-colors motion-reduce:transition-none"
              >
                + Add expense
              </button>
            </div>

            {/* Desktop: full editable table */}
            <div className="hidden sm:block flex-1 min-h-0 overflow-auto">
              <table className="sheet-table table-fixed w-full">
                <ExpensesTableColgroup />
                <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                  <TableRow className="hover:bg-transparent border-0">
                    <TableHead className="py-4 px-5 h-auto">
                      <ColumnHeader label="Name" sortKey="name" sort={sort} onSort={toggleSort} filter={{ field: 'name', type: 'text', value: filters.name ?? null, onChange: (n) => setColumnFilter('name', n) }} />
                    </TableHead>
                    <TableHead className="py-4 px-5 h-auto hidden sm:table-cell">
                      <ColumnHeader label="Category" sortKey="category_name" sort={sort} onSort={toggleSort} />
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedExpenses.map((expense) => (
                    <TableRow
                      key={expense.id}
                      className="border-0 cursor-pointer"
                      onClick={() => setRowForm({ mode: 'edit', expense })}
                    >
                      <TableCell className="py-5 px-5 max-w-0 overflow-hidden">
                        <button
                          type="button"
                          className="w-full text-left truncate block hover:text-primary transition-colors"
                          title={expense.name}
                        >
                          {expense.name}
                        </button>
                      </TableCell>
                      <TableCell className="py-5 px-5 max-w-0 overflow-hidden hidden sm:table-cell">
                        <span
                          className="block truncate text-primary"
                          title={categoryNameById.get(String(expense.category_id)) ?? undefined}
                        >
                          {categoryNameById.get(String(expense.category_id)) ?? (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="py-5 px-5 text-right tabular-nums">
                        {fmtMoney(expense.period_amount)}
                      </TableCell>
                      <TableCell className="py-5 px-5 max-w-0 overflow-hidden hidden sm:table-cell">
                        <span
                          className="block truncate text-primary text-sm"
                          title={(expense.payment_methods ?? []).map((pm) => pm.origin ? `${pm.name} (${pm.origin})` : pm.name).join(', ') || undefined}
                        >
                          {(expense.payment_methods ?? []).length > 0
                            ? (expense.payment_methods ?? []).map((pm, i) => (
                                <span key={pm.payment_method_id}>
                                  {i > 0 ? ', ' : ''}{pm.name}
                                  {pm.origin ? (
                                    <>
                                      {' '}
                                      <span className="text-xs text-muted-foreground">({pm.origin})</span>
                                    </>
                                  ) : null}
                                </span>
                              ))
                            : <span className="text-muted-foreground/50">—</span>
                          }
                        </span>
                      </TableCell>
                      {/* Checkboxes stay inline as quick toggles, so their
                          clicks must not also open the expense modal. */}
                      <TableCell
                        className="py-5 px-5 text-center hidden sm:table-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-center">
                          <Checkbox
                            checked={expense.is_paid}
                            onCheckedChange={(checked) => toggleCheckboxColumn(expense, { is_paid: Boolean(checked) })}
                          />
                        </div>
                      </TableCell>
                      <TableCell
                        className="py-5 px-5 text-center hidden sm:table-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-center">
                          <Checkbox
                            checked={expense.is_recurring}
                            onCheckedChange={(checked) =>
                              toggleCheckboxColumn(
                                expense,
                                checked ? { is_recurring: true } : { is_recurring: false, recurring_months: '' },
                              )
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenses.length > 0 && (
                    <TableRow
                      className="border-0 cursor-pointer group add-hint"
                      onClick={() => setRowForm({ mode: 'add' })}
                      aria-label="Add expense"
                    >
                      <TableCell
                        colSpan={6}
                        className="py-3 px-5 text-center text-muted-foreground/60 select-none group-hover:text-primary transition-colors"
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
              <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0">
                <span className="text-xs text-muted-foreground">
                  {data.pagination.total === 0
                    ? '0 expenses'
                    : `${(page - 1) * PAGE_LIMIT + 1}–${Math.min(page * PAGE_LIMIT, data.pagination.total)} of ${data.pagination.total}`}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="xs"
                    className="text-foreground"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ‹ Prev
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
                    {page} / {Math.max(1, Math.ceil(data.pagination.total / PAGE_LIMIT))}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    className="text-foreground"
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
        isSaving={rowForm.mode === 'edit' ? update.isPending : create.isPending}
        onDelete={
          rowForm.mode === 'edit'
            ? () => {
                del.mutate(rowForm.expense.id)
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
  const [pendingPmAmount, setPendingPmAmount] = useState('')

  const canSave = form.name.trim().length > 0 && !!form.amount
  const monthsLeft = expense?.is_recurring ? remainingMonths(expense, periodDate) : null

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="w-[min(94vw,30rem)] sm:max-w-[30rem] max-h-[90vh] overflow-y-auto">
        <DialogTitle>{mode === 'add' ? 'Add expense' : 'Edit expense'}</DialogTitle>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Expense name"
              className="w-full"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Amount</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => {
                  // Support comma as decimal separator and convert to dot
                  const val = e.target.value.replace(',', '.')
                  setForm((f) => ({ ...f, amount: val }))
                }}
                placeholder="0.00"
                className="w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Date</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full text-sm sm:text-base"
              />
            </div>
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
            <label className="block text-sm font-medium mb-1.5">Payment methods</label>
            <div className="flex flex-col gap-2">
              {form.payment_methods.map((pm, i) => (
                <AddFormPmRow
                  key={pm.payment_method_id}
                  pmId={pm.payment_method_id}
                  partialAmount={pm.partial_amount}
                  onAmountChange={(val) =>
                    setForm((f) => ({
                      ...f,
                      payment_methods: f.payment_methods.map((p, j) =>
                        j === i ? { ...p, partial_amount: val } : p
                      ),
                    }))
                  }
                  onRemove={() =>
                    setForm((f) => ({
                      ...f,
                      payment_methods: f.payment_methods.filter((_, j) => j !== i),
                    }))
                  }
                />
              ))}
              <PaymentMethodCombobox
                value=""
                onChange={(id) => {
                  if (!id) return
                  setForm((f) => ({
                    ...f,
                    payment_methods: [...f.payment_methods, { payment_method_id: id, partial_amount: pendingPmAmount }],
                  }))
                  setPendingPmAmount('')
                }}
                amount={pendingPmAmount}
                onAmountChange={setPendingPmAmount}
                placeholder="Add payment method"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
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
                <label htmlFor="expense_row_months" className="block text-sm font-medium mb-1.5">
                  Months limit
                  {monthsLeft != null && (
                    <span className="ml-1 font-normal text-muted-foreground">({monthsLeft} left)</span>
                  )}
                </label>
                <Input
                  id="expense_row_months"
                  type="number"
                  min="1"
                  placeholder="No limit"
                  value={form.recurring_months}
                  onChange={(e) => setForm((f) => ({ ...f, recurring_months: e.target.value }))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            {mode === 'edit' && onDelete && (
              <Button variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            )}
            <Button className="flex-1" disabled={!canSave || isSaving} onClick={() => onSubmit(form)}>
              {isSaving ? <Loader2 className="animate-spin" /> : 'Save'}
            </Button>
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
}: {
  pmId: string
  partialAmount: string
  onAmountChange: (val: string) => void
  onRemove: () => void
}) {
  const { data } = usePaymentMethods()
  const pm = data?.payment_methods.find((p) => String(p.id) === pmId)
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="flex-1 truncate text-primary">
        {pm?.name ?? pmId}
        {pm?.origin ? (
          <span className="text-muted-foreground"> ({pm.origin})</span>
        ) : null}
      </span>
      <Input
        type="number"
        className="w-20 h-6 text-xs text-right px-1.5 py-0"
        min="0"
        step="0.01"
        placeholder="amt"
        value={partialAmount}
        onChange={(e) => onAmountChange(e.target.value)}
      />
      <button
        type="button"
        className="text-destructive hover:text-destructive/80 shrink-0"
        onClick={onRemove}
        aria-label="Remove"
      >
        ✕
      </button>
    </div>
  )
}
