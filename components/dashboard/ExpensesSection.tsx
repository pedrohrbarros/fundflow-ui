'use client'

import { useRef, useState } from 'react'
import { Infinity as InfinityIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses'
import { usePaymentMethods } from '@/hooks/use-payment-methods'
import { fmtMoney, normalizeAmountInput } from '@/lib/format'
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface RowForm {
  name: string
  amount: string
  category_id: string
  is_paid: boolean
  is_saved: boolean
  payment_method_id: string
  is_recurring: boolean
  recurring_months: string
}

type EditField = 'name' | 'category' | 'amount' | 'payment_method'

type ExpenseUpdatePayload = {
  id: string
  name: string
  category_id: number | null
  amount: number
  is_recurring: boolean
  recurring_months: number | null
  is_paid: boolean
  paid_period?: string | null
  is_saved: boolean
  saved_period?: string | null
  payment_method_id: number | null
}

const emptyForm: RowForm = {
  name: '',
  amount: '',
  category_id: '',
  is_paid: false,
  is_saved: false,
  payment_method_id: '',
  is_recurring: false,
  recurring_months: '',
}

function ExpensesTableColgroup() {
  return (
    <colgroup>
      <col style={{ width: '24%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '13%' }} />
      <col style={{ width: '27%' }} />
      <col style={{ width: '6%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '6%' }} />
      <col style={{ width: '6%' }} />
    </colgroup>
  )
}

function remainingMonths(
  expense: { date: string; recurring_months: number | null },
  periodDate: string
): number | null {
  if (expense.recurring_months == null) return null
  const [expenseYear, expenseMonth] = expense.date.split('-').map(Number)
  const [periodYear, periodMonth] = periodDate.split('-').map(Number)
  const monthsDiff = (periodYear - expenseYear) * 12 + (periodMonth - expenseMonth)
  return Math.max(0, expense.recurring_months - monthsDiff)
}

function formFromExpense(expense: Expense): RowForm {
  return {
    name: expense.name,
    amount: String(expense.amount),
    category_id: String(expense.category_id ?? ''),
    is_paid: expense.is_paid,
    is_saved: expense.is_saved,
    payment_method_id: normalizeId(expense.payment_method_id) ?? '',
    is_recurring: expense.is_recurring,
    recurring_months: expense.recurring_months != null ? String(expense.recurring_months) : '',
  }
}

function formHasChanges(expense: Expense, form: RowForm) {
  const amount = parseFloat(form.amount) || 0
  const formRecurringMonths = form.is_recurring ? parseInt(form.recurring_months, 10) || null : null

  return (
    form.name.trim() !== expense.name ||
    String(expense.category_id ?? '') !== form.category_id ||
    amount !== expense.amount ||
    form.is_recurring !== expense.is_recurring ||
    formRecurringMonths !== expense.recurring_months ||
    form.is_paid !== expense.is_paid ||
    form.is_saved !== expense.is_saved ||
    form.payment_method_id !== (normalizeId(expense.payment_method_id) ?? '')
  )
}

// Ticking Paid or Saved on a recurring expense only speaks for the month on screen,
// so the payload stamps the period the tick happened in. A non-recurring expense
// exists in one month only and leaves the periods alone.
function periodStamp(isRecurring: boolean, flag: boolean, periodDate: string) {
  if (!isRecurring) return undefined
  return flag ? periodDate.slice(0, 7) : null
}

function buildPayload(id: string, form: RowForm, periodDate: string): ExpenseUpdatePayload {
  const nextIsRecurring = form.is_recurring
  return {
    id,
    name: form.name.trim(),
    amount: parseFloat(form.amount) || 0,
    category_id: form.category_id ? parseInt(form.category_id, 10) : null,
    is_recurring: nextIsRecurring,
    recurring_months: nextIsRecurring ? parseInt(form.recurring_months, 10) || null : null,
    is_paid: form.is_paid,
    paid_period: periodStamp(nextIsRecurring, form.is_paid, periodDate),
    is_saved: form.is_saved,
    saved_period: periodStamp(nextIsRecurring, form.is_saved, periodDate),
    payment_method_id: form.payment_method_id ? parseInt(form.payment_method_id, 10) : null,
  }
}

function buildCreateBody(form: RowForm, periodDate: string) {
  return {
    name: form.name.trim(),
    amount: parseFloat(form.amount) || 0,
    category_id: form.category_id ? parseInt(form.category_id, 10) : null,
    // The date input is gone; new expenses anchor to the selected period.
    date: periodDate,
    is_recurring: form.is_recurring,
    recurring_months: form.is_recurring ? parseInt(form.recurring_months, 10) || null : null,
    is_paid: form.is_paid,
    paid_period: periodStamp(form.is_recurring, form.is_paid, periodDate),
    is_saved: form.is_saved,
    saved_period: periodStamp(form.is_recurring, form.is_saved, periodDate),
    payment_method_id: form.payment_method_id ? parseInt(form.payment_method_id, 10) : null,
  }
}

// Ids are declared as strings but arrive from the API as numbers, so anything
// comparing or keying on them has to normalise first.
function normalizeId(id: string | number | null | undefined): string | null {
  return id == null || id === '' ? null : String(id)
}

function mergePendingExpense(expense: Expense, payload: ExpenseUpdatePayload): Expense {
  const nextPaymentMethodId =
    payload.payment_method_id == null ? null : String(payload.payment_method_id)
  return {
    ...expense,
    name: payload.name,
    amount: payload.amount,
    period_amount: payload.amount,
    category_id: payload.category_id == null ? null : String(payload.category_id),
    is_recurring: payload.is_recurring,
    recurring_months: payload.recurring_months,
    is_paid: payload.is_paid,
    is_saved: payload.is_saved,
    payment_method_id: nextPaymentMethodId,
    // Keep the row's own record whenever the method itself did not change —
    // both sides must be normalised, since the API sends numeric ids and this
    // payload carries strings. Only a genuinely new pick drops it, and its
    // name then comes from the loaded methods or the refetch.
    payment_method:
      nextPaymentMethodId === normalizeId(expense.payment_method_id)
        ? expense.payment_method
        : null,
  }
}

const PAGE_LIMIT = 100

// Naming the toast ourselves is what makes it dismissable. Letting sonner mint
// the id does not work here: `toast.custom` computes one and then spreads the
// options over it, so passing `id: undefined` (which is what an unopened toast
// would pass) overwrites it and the toast is filed under a second, private id.
// The id we get back then dismisses nothing, and the next keystroke opens a
// duplicate that stays on screen for good.
const SHARED_TOAST_ID = 'expenses-save-changes'

export function ExpensesSection() {
  const [filters, setFilters] = useState<Record<string, ExpenseFilter>>({})
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>({
    key: 'amount',
    dir: 'desc',
  })
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
  const [editing, setEditing] = useState<{ id: string; field: EditField } | null>(null)
  const [draft, setDraft] = useState<RowForm>(emptyForm)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [pendingEdits, setPendingEdits] = useState<Record<string, ExpenseUpdatePayload>>({})
  const sharedToastOpen = useRef(false)
  // Mobile-only: tap a row (or add) to edit every field in one modal. The
  // desktop table edits each field in place instead.
  const [rowForm, setRowForm] = useState<{ mode: 'add' } | { mode: 'edit'; expense: Expense } | null>(
    null
  )

  const expenses = data?.expenses ?? []
  const sortedExpenses = expenses.map((e) =>
    pendingEdits[e.id] ? mergePendingExpense(e, pendingEdits[e.id]) : e
  )
  const isEmpty = !isLoading && !expenses.length && !isAdding

  const { data: categoriesData } = useCategories()
  const categoryNameById = new Map(
    (categoriesData?.categories ?? []).map((c) => [String(c.id), c.name])
  )
  const usedCategoryIds = new Set(expenses.map((e) => String(e.category_id)))

  // Resolving from the loaded methods (rather than the row's embedded record)
  // lets a freshly picked method show its name before the refetch lands.
  const { data: paymentMethodsData } = usePaymentMethods()
  const paymentMethodById = new Map(
    (paymentMethodsData?.payment_methods ?? []).map((pm) => [String(pm.id), pm])
  )

  function paymentMethodFor(expense: Expense) {
    const id = normalizeId(expense.payment_method_id)
    if (!id) return null
    return paymentMethodById.get(id) ?? expense.payment_method
  }

  // Sonner defers a dismiss to the next frame but applies a new toast right
  // away, so dismissing one that is not on screen can reach forward and close
  // the toast the next keystroke opens. Only ever dismiss what is actually up.
  function dismissSharedToast() {
    if (!sharedToastOpen.current) return
    sharedToastOpen.current = false
    toast.dismiss(SHARED_TOAST_ID)
  }

  function clearAllPending() {
    dismissSharedToast()
    setPendingEdits({})
    setDraft(emptyForm)
    setEditing(null)
    setIsAdding(false)
    setAddForm(emptyForm)
  }

  // A new expense is a pending change like any edit, so the toast persists both.
  async function performSave(payloads: ExpenseUpdatePayload[], addDraft: RowForm | null) {
    await Promise.all([
      ...payloads.map((p) => update.mutateAsync(p)),
      ...(addDraft ? [create.mutateAsync(buildCreateBody(addDraft, periodDate))] : []),
    ])
    clearAllPending()
  }

  // Every keystroke in the add row lands here, so the toast is re-rendered
  // constantly. Always addressing the same id updates that toast in place;
  // dismissing and re-creating it would replay the enter animation on every
  // character.
  function showSharedToast(payloads: ExpenseUpdatePayload[], addDraft: RowForm | null) {
    const count = payloads.length + (addDraft ? 1 : 0)
    sharedToastOpen.current = true
    toast.custom(
      (t) => (
        <SaveChangesToast
          t={t}
          successMessage={count === 1 ? 'Expense saved' : `${count} expenses saved`}
          onSave={async () => await performSave(payloads, addDraft)}
          onRevert={() => clearAllPending()}
        />
      ),
      // The toast waits for an answer rather than timing out: nothing here is
      // saved until Save is pressed, so letting it fade would strand the draft.
      { id: SHARED_TOAST_ID, duration: Infinity }
    )
  }

  // The add row only counts as pending once it has the fields a create needs.
  function addDraftOf(form: RowForm): RowForm | null {
    return isAdding && form.name.trim() && form.amount ? form : null
  }

  function commitChanges(expense: Expense, form: RowForm) {
    if (!form.name.trim() || !formHasChanges(expense, form)) return
    const payload = buildPayload(expense.id, form, periodDate)
    const nextPending = { ...pendingEdits, [expense.id]: payload }
    setPendingEdits(nextPending)
    showSharedToast(Object.values(nextPending), addDraftOf(addForm))
  }

  // Every add-row field routes through here so the toast always reflects the
  // latest draft — it is the only way to save a new expense now.
  function updateAddForm(patch: Partial<RowForm>) {
    const next = { ...addForm, ...patch }
    setAddForm(next)
    const addDraft = addDraftOf(next)
    const payloads = Object.values(pendingEdits)
    if (addDraft || payloads.length > 0) showSharedToast(payloads, addDraft)
    else dismissSharedToast()
  }

  function cancelAdd() {
    setIsAdding(false)
    setAddForm(emptyForm)
    const payloads = Object.values(pendingEdits)
    if (payloads.length > 0) showSharedToast(payloads, null)
    else dismissSharedToast()
  }

  // Checkbox columns are drafts like any other field: queue the change and
  // let the shared toast's Save/auto-save timer persist it. `expense` here is
  // already the pending-merged display row, so this layers on top correctly.
  function toggleCheckboxColumn(
    expense: Expense,
    patch: Partial<Pick<RowForm, 'is_paid' | 'is_saved' | 'is_recurring' | 'recurring_months'>>
  ) {
    commitChanges(expense, { ...formFromExpense(expense), ...patch })
  }

  function startFieldEdit(expense: Expense, field: EditField) {
    setEditing({ id: expense.id, field })
    setDraft(formFromExpense(expense))
  }

  function commitDraftField(expenseId: string, patch?: Partial<RowForm>) {
    const expense = sortedExpenses.find((e) => e.id === expenseId)
    const nextDraft = patch ? { ...draft, ...patch } : draft
    setEditing(null)
    setDraft(emptyForm)
    if (expense) commitChanges(expense, nextDraft)
  }

  // Enter is an explicit save, so it persists everything pending straight away
  // rather than waiting for the toast's Save button.
  function saveAddNow() {
    const addDraft = addDraftOf(addForm)
    if (!addDraft) return
    performSave(Object.values(pendingEdits), addDraft).catch(() =>
      toast.error('Failed to save changes')
    )
  }

  function submitRowForm(form: RowForm) {
    if (rowForm?.mode === 'edit') {
      update.mutate(buildPayload(rowForm.expense.id, form, periodDate), {
        onSuccess: () => setRowForm(null),
      })
    } else {
      if (!form.name.trim() || !form.amount) return
      create.mutate(buildCreateBody(form, periodDate), { onSuccess: () => setRowForm(null) })
    }
  }

  return (
    <>
      <section className="flex flex-col flex-1 min-h-0">
        <div className="border border-border rounded-xl bg-card shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-16 flex-1"
              role="status"
              aria-label="Loading"
            >
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : isEmpty ? (
            <div className="flex-1 flex items-center justify-center">
              <button
                type="button"
                aria-label="Add expense"
                onClick={() => setIsAdding(true)}
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
                    <span className="shrink-0 tabular-nums text-foreground">
                      {fmtMoney(expense.period_amount)}
                    </span>
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

              {/* Desktop: every field edited in place, no modal */}
              <div className="hidden sm:block flex-1 min-h-0 overflow-auto">
                <table className="sheet-table table-fixed w-full">
                  <ExpensesTableColgroup />
                  <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                    <TableRow className="hover:bg-transparent border-0">
                      <TableHead className="py-4 px-5 h-auto">
                        <ColumnHeader
                          label="Name"
                          sortKey="name"
                          sort={sort}
                          onSort={toggleSort}
                          filter={{
                            field: 'name',
                            type: 'text',
                            value: filters.name ?? null,
                            onChange: (n) => setColumnFilter('name', n),
                          }}
                        />
                      </TableHead>
                      <TableHead className="py-4 px-5 h-auto">
                        <ColumnHeader
                          label="Category"
                          sortKey="category_name"
                          sort={sort}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead className="py-4 px-5 h-auto">
                        <ColumnHeader
                          label="Amount"
                          align="right"
                          sortKey="amount"
                          sort={sort}
                          onSort={toggleSort}
                          filter={{
                            field: 'amount',
                            type: 'number',
                            value: filters.amount ?? null,
                            onChange: (n) => setColumnFilter('amount', n),
                          }}
                        />
                      </TableHead>
                      <TableHead className="py-4 px-5 h-auto">
                        <ColumnHeader
                          label="Payment Method"
                          sortKey="payment_method_name"
                          sort={sort}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead className="py-4 px-2 h-auto">
                        <ColumnHeader
                          label="Paid"
                          align="center"
                          sortKey="is_paid"
                          sort={sort}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead className="py-4 px-2 h-auto text-center">
                        <ColumnHeader
                          label="Recurring"
                          align="center"
                          sortKey="is_recurring"
                          sort={sort}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead className="py-4 px-2 h-auto text-center">
                        <ColumnHeader
                          label="Saved"
                          align="center"
                          sortKey="is_saved"
                          sort={sort}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead className="py-4 pl-0 pr-3 h-auto text-right" />
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
                                onBlur={() => commitDraftField(expense.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitDraftField(expense.id)
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
                                className="w-full text-left truncate block hover:text-primary transition-colors"
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
                                onChange={(id) =>
                                  commitDraftField(expense.id, { category_id: id })
                                }
                                type="EXPENSE"
                                usedCategoryIds={usedCategoryIds}
                                autoOpen
                              />
                            ) : (
                              <button
                                type="button"
                                className="w-full text-left truncate block text-primary hover:text-primary/80 transition-colors"
                                title={
                                  categoryNameById.get(String(expense.category_id)) ?? undefined
                                }
                                onClick={() => startFieldEdit(expense, 'category')}
                              >
                                {categoryNameById.get(String(expense.category_id)) ?? (
                                  <span className="text-muted-foreground/50">—</span>
                                )}
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="py-5 px-5 text-right">
                            {isEditing && editing.field === 'amount' ? (
                              <Input
                                type="text"
                                inputMode="decimal"
                                className="min-w-0 text-right text-[1rem]"
                                value={draft.amount}
                                onChange={(e) =>
                                  setDraft((f) => ({
                                    ...f,
                                    amount: normalizeAmountInput(e.target.value),
                                  }))
                                }
                                onBlur={() => commitDraftField(expense.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitDraftField(expense.id)
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
                                className="w-full text-right tabular-nums hover:text-primary transition-colors"
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
                                onChange={(id) =>
                                  commitDraftField(expense.id, { payment_method_id: id })
                                }
                                autoOpen
                              />
                            ) : (
                              (() => {
                                const paymentMethod = paymentMethodFor(expense)
                                return (
                                  <button
                                    type="button"
                                    onClick={() => startFieldEdit(expense, 'payment_method')}
                                    className="w-full text-left truncate text-primary text-sm hover:text-primary/80 transition-colors block"
                                    title={
                                      paymentMethod
                                        ? `${paymentMethod.name} (${paymentMethod.origin})`
                                        : undefined
                                    }
                                  >
                                    {paymentMethod ? (
                                      <>
                                        {paymentMethod.name}
                                        {paymentMethod.origin ? (
                                          <>
                                            {' '}
                                            <span className="text-xs text-muted-foreground">
                                              ({paymentMethod.origin})
                                            </span>
                                          </>
                                        ) : null}
                                      </>
                                    ) : (
                                      <span className="text-muted-foreground/50">—</span>
                                    )}
                                  </button>
                                )
                              })()
                            )}
                          </TableCell>
                          <TableCell className="py-5 px-2 text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={expense.is_paid}
                                onCheckedChange={(checked) =>
                                  toggleCheckboxColumn(expense, { is_paid: Boolean(checked) })
                                }
                              />
                            </div>
                          </TableCell>
                          {/* The infinity button holds its place even when the
                              expense does not recur, so the column stays aligned. */}
                          <TableCell className="py-5 px-2">
                            <div className="flex items-center justify-center gap-1.5">
                              <Checkbox
                                checked={expense.is_recurring}
                                onCheckedChange={(checked) =>
                                  toggleCheckboxColumn(
                                    expense,
                                    checked
                                      ? { is_recurring: true }
                                      : { is_recurring: false, recurring_months: '' }
                                  )
                                }
                              />
                              <MonthsLimitPopover
                                disabled={!expense.is_recurring}
                                value={
                                  expense.recurring_months != null
                                    ? String(expense.recurring_months)
                                    : ''
                                }
                                monthsLeft={remainingMonths(expense, periodDate)}
                                onSave={(recurring_months) =>
                                  toggleCheckboxColumn(expense, { recurring_months })
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-2 text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={expense.is_saved}
                                onCheckedChange={(checked) =>
                                  toggleCheckboxColumn(expense, { is_saved: Boolean(checked) })
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-5 pl-0 pr-3 text-right">
                            <div className="flex items-center justify-end">
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                  setDeletingExpenseId(expense.id)
                                  del.mutate(expense.id, {
                                    onSettled: () => setDeletingExpenseId(null),
                                  })
                                }}
                                disabled={del.isPending}
                                aria-label="Delete expense"
                              >
                                {deletingExpenseId === expense.id ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  '✕'
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {isAdding && (
                      <TableRow className="add-row border-0">
                        <TableCell className="py-5 px-5">
                          <Input
                            className="min-w-0 text-[1rem]"
                            placeholder="Expense name"
                            value={addForm.name}
                            onChange={(e) => updateAddForm({ name: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveAddNow()
                              if (e.key === 'Escape') cancelAdd()
                            }}
                            autoFocus
                          />
                        </TableCell>
                        <TableCell className="py-5 px-5">
                          <CategoryCombobox
                            value={addForm.category_id}
                            onChange={(v) => updateAddForm({ category_id: v })}
                            type="EXPENSE"
                            usedCategoryIds={usedCategoryIds}
                            autoOpen={false}
                          />
                        </TableCell>
                        <TableCell className="py-5 px-5">
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="min-w-0 text-right text-[1rem]"
                            placeholder="0.00"
                            value={addForm.amount}
                            onChange={(e) =>
                              updateAddForm({ amount: normalizeAmountInput(e.target.value) })
                            }
                            onKeyDown={(e) => e.key === 'Enter' && saveAddNow()}
                          />
                        </TableCell>
                        <TableCell className="py-5 px-5">
                          <PaymentMethodCombobox
                            value={addForm.payment_method_id}
                            onChange={(id) => updateAddForm({ payment_method_id: id })}
                            placeholder="Payment method"
                          />
                        </TableCell>
                        <TableCell className="py-5 px-2 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={addForm.is_paid}
                              onCheckedChange={(checked) =>
                                updateAddForm({ is_paid: Boolean(checked) })
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-2">
                          <div className="flex items-center justify-center gap-1.5">
                            <Checkbox
                              checked={addForm.is_recurring}
                              onCheckedChange={(checked) =>
                                updateAddForm({
                                  is_recurring: Boolean(checked),
                                  recurring_months: '',
                                })
                              }
                            />
                            <MonthsLimitPopover
                              disabled={!addForm.is_recurring}
                              value={addForm.recurring_months}
                              onSave={(recurring_months) => updateAddForm({ recurring_months })}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-2 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={addForm.is_saved}
                              onCheckedChange={(checked) =>
                                updateAddForm({ is_saved: Boolean(checked) })
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-5 pl-0 pr-3 text-right">
                          <div className="flex items-center justify-end">
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={cancelAdd}
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
                        onClick={() => setIsAdding(true)}
                        aria-label="Add expense"
                      >
                        <TableCell
                          colSpan={8}
                          className="py-3 px-5 text-center text-muted-foreground/60 select-none group-hover:text-primary transition-colors"
                        >
                          <span className="text-xl leading-none font-light" aria-hidden="true">
                            +
                          </span>
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

/**
 * The months limit is a rarely-touched detail, so it hides behind the infinity
 * button that appears next to a ticked Recurring box. A primary-tinted icon
 * means the recurrence is capped; muted means it runs forever.
 */
function MonthsLimitPopover({
  value,
  onSave,
  monthsLeft,
  disabled = false,
}: {
  value: string
  onSave: (recurringMonths: string) => void
  monthsLeft?: number | null
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const hasLimit = value.trim().length > 0

  function handleOpen(isOpen: boolean) {
    if (isOpen) setLocalValue(value)
    setOpen(isOpen)
  }

  function commit() {
    onSave(localValue.trim())
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={hasLimit ? 'Edit months limit' : 'Set a months limit'}
        title={
          disabled
            ? 'Only recurring expenses can have a months limit'
            : hasLimit
              ? `Repeats ${value} month${value === '1' ? '' : 's'}`
              : 'Repeats indefinitely — set a limit'
        }
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center justify-center rounded-md size-6 shrink-0 transition-colors ${
          disabled
            ? 'text-muted-foreground/25 cursor-not-allowed'
            : hasLimit
              ? 'text-primary hover:bg-accent'
              : 'text-muted-foreground/60 hover:bg-accent hover:text-foreground'
        }`}
      >
        <InfinityIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        align="center"
        className="bg-popover border border-border p-3 w-56 text-popover-foreground"
      >
        <label htmlFor="recurring_months_limit" className="block text-sm font-medium mb-2">
          Months limit
          {monthsLeft != null && (
            <span className="ml-1 font-normal text-muted-foreground">({monthsLeft} left)</span>
          )}
        </label>
        <Input
          id="recurring_months_limit"
          type="number"
          min="1"
          placeholder="No limit"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
          }}
          className="w-full"
          autoFocus
        />
        <Button size="sm" className="w-full mt-3" onClick={commit}>
          Save
        </Button>
      </PopoverContent>
    </Popover>
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
  const [form, setForm] = useState<RowForm>(expense ? formFromExpense(expense) : emptyForm)

  const canSave = form.name.trim().length > 0 && !!form.amount
  const monthsLeft = expense?.is_recurring ? remainingMonths(expense, periodDate) : null

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
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

          <div>
            <label className="block text-sm font-medium mb-1.5">Amount</label>
            <Input
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: normalizeAmountInput(e.target.value) }))
              }
              placeholder="0.00"
              className="w-full text-left"
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
            <label className="block text-sm font-medium mb-1.5">Payment method</label>
            <PaymentMethodCombobox
              value={form.payment_method_id}
              onChange={(id) => setForm((f) => ({ ...f, payment_method_id: id }))}
              placeholder="Payment method"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="expense_row_paid"
                  checked={form.is_paid}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, is_paid: Boolean(checked) }))
                  }
                />
                <label htmlFor="expense_row_paid" className="text-sm font-medium cursor-pointer">
                  Paid
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="expense_row_recurring"
                  checked={form.is_recurring}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({
                      ...f,
                      is_recurring: Boolean(checked),
                      recurring_months: Boolean(checked) ? f.recurring_months : '',
                    }))
                  }
                />
                <label
                  htmlFor="expense_row_recurring"
                  className="text-sm font-medium cursor-pointer"
                >
                  Recurring
                </label>
                <MonthsLimitPopover
                  disabled={!form.is_recurring}
                  value={form.recurring_months}
                  monthsLeft={monthsLeft}
                  onSave={(recurring_months) => setForm((f) => ({ ...f, recurring_months }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="expense_row_saved"
                  checked={form.is_saved}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, is_saved: Boolean(checked) }))
                  }
                />
                <label htmlFor="expense_row_saved" className="text-sm font-medium cursor-pointer">
                  Saved
                </label>
              </div>
            </div>
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
