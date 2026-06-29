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

type EditField = 'name' | 'category' | 'amount' | 'date'

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
  payment_methods: { payment_method_id: number; partial_amount: number }[]
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
      <col style={{ width: '21%' }} />
      <col style={{ width: '9%' }} />
      <col style={{ width: '23%' }} />
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
    payment_methods: expense.payment_methods.map((pm) => ({
      payment_method_id: pm.payment_method_id,
      partial_amount: String(pm.partial_amount),
    })),
    date: expense.date,
    is_recurring: expense.is_recurring,
    recurring_months: expense.recurring_months != null ? String(expense.recurring_months) : '',
  }
}

function formHasChanges(expense: Expense, form: RowForm) {
  const amount = parseFloat(form.amount) || 0
  const formPMIds = form.payment_methods.map((pm) => pm.payment_method_id).sort().join(',')
  const expensePMIds = expense.payment_methods.map((pm) => pm.payment_method_id).sort().join(',')
  const pmAmountsChanged = form.payment_methods.some((fpm) => {
    const epm = expense.payment_methods.find((e) => e.payment_method_id === fpm.payment_method_id)
    return !epm || Math.abs((parseFloat(fpm.partial_amount) || 0) - epm.partial_amount) > 0.001
  })
  const formRecurringMonths = form.is_recurring ? (parseInt(form.recurring_months, 10) || null) : null

  return (
    form.name.trim() !== expense.name ||
    String(expense.category_id ?? '') !== form.category_id ||
    amount !== expense.amount ||
    form.date !== expense.date ||
    form.is_recurring !== expense.is_recurring ||
    formRecurringMonths !== expense.recurring_months ||
    formPMIds !== expensePMIds ||
    pmAmountsChanged
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
    recurring_months: form.is_recurring ? (parseInt(form.recurring_months, 10) || null) : null,
    is_paid: expense.is_paid,
    is_saved: expense.is_saved,
    payment_methods: form.payment_methods
      .filter((pm) => pm.payment_method_id)
      .map((pm) => ({
        payment_method_id: parseInt(pm.payment_method_id, 10),
        partial_amount: parseFloat(pm.partial_amount) || 0,
      })),
  }
}

function mergePendingExpense(expense: Expense, payload: ExpenseUpdatePayload): Expense {
  const pmMap = new Map(expense.payment_methods.map((pm) => [String(pm.payment_method_id), pm]))
  return {
    ...expense,
    name: payload.name,
    amount: payload.amount,
    category_id: payload.category_id == null ? null : String(payload.category_id),
    date: payload.date,
    is_recurring: payload.is_recurring,
    recurring_months: payload.recurring_months,
    payment_methods: payload.payment_methods.map((pm) => {
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

export function ExpensesSection() {
  const [filters, setFilters] = useState<Record<string, ExpenseFilter>>({})
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>({ key: 'amount', dir: 'desc' })

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
  const sharedToastId = useRef<string | number | undefined>(undefined)

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
                    <TableHead className="py-4 px-5 h-auto">
                      <ColumnHeader label="Recurring" align="center" sortKey="is_recurring" sort={sort} onSort={toggleSort} />
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
                          <div
                            className="w-full text-left truncate text-green-700 dark:text-green-400 text-sm"
                            title={(expense.payment_methods ?? []).map((pm) => pm.origin ? `${pm.name} (${pm.origin})` : pm.name).join(', ') || undefined}
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
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Checkbox
                              checked={expense.is_recurring}
                              onCheckedChange={(checked) => {
                                const merged = { ...formFromExpense(expense), is_recurring: Boolean(checked), recurring_months: Boolean(checked) ? formFromExpense(expense).recurring_months : '' }
                                commitChanges(expense, merged)
                              }}
                            />
                            {expense.is_recurring && expense.recurring_months != null && (
                              <span className="text-xs text-green-600 dark:text-[#86efac]/70 font-mono">{expense.recurring_months}mo</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-5 text-right flex items-center justify-end gap-2">
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
                        <div className="flex flex-col gap-1">
                          <PaymentMethodCombobox
                            value=""
                            onChange={(id) => {
                              if (!id || addForm.payment_methods.some((pm) => pm.payment_method_id === id)) return
                              setAddForm((f) => ({
                                ...f,
                                payment_methods: [...f.payment_methods, { payment_method_id: id, partial_amount: '' }],
                              }))
                            }}
                            placeholder="Add payment method"
                          />
                          {addForm.payment_methods.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                              {addForm.payment_methods.map((pm, i) => (
                                <AddFormPmRow
                                  key={pm.payment_method_id}
                                  pmId={pm.payment_method_id}
                                  partialAmount={pm.partial_amount}
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
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Checkbox
                            checked={addForm.is_recurring}
                            onCheckedChange={(checked) => setAddForm((f) => ({ ...f, is_recurring: Boolean(checked), recurring_months: Boolean(checked) ? f.recurring_months : '' }))}
                          />
                          {addForm.is_recurring && (
                            <Input
                              type="number"
                              className="w-14 text-center text-xs px-1 py-0.5 h-6"
                              min="1"
                              placeholder="∞"
                              value={addForm.recurring_months}
                              onChange={(e) => setAddForm((f) => ({ ...f, recurring_months: e.target.value }))}
                              title="Recurring months limit"
                            />
                          )}
                        </div>
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
                        colSpan={6}
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
    </div>
  )
}

function ExpenseExtraTools({
  expense,
  onUpdate,
}: {
  expense: Expense
  onUpdate: (updates: {
    date: string
    is_paid: boolean
    is_saved: boolean
    recurring_months: string
    payment_methods: PmEntry[]
  }) => void
}) {
  const [open, setOpen] = useState(false)
  const [localDraft, setLocalDraft] = useState({
    date: expense.date,
    is_paid: expense.is_paid,
    is_saved: expense.is_saved,
    recurring_months: expense.recurring_months != null ? String(expense.recurring_months) : '',
    payment_methods: expense.payment_methods.map((pm) => ({
      payment_method_id: pm.payment_method_id,
      partial_amount: String(pm.partial_amount),
    })),
  })

  const { data: pmData } = usePaymentMethods()
  const paymentMethods = pmData?.payment_methods ?? []

  function handleOpen(o: boolean) {
    if (o) {
      setLocalDraft({
        date: expense.date,
        is_paid: expense.is_paid,
        is_saved: expense.is_saved,
        recurring_months: expense.recurring_months != null ? String(expense.recurring_months) : '',
        payment_methods: expense.payment_methods.map((pm) => ({
          payment_method_id: pm.payment_method_id,
          partial_amount: String(pm.partial_amount),
        })),
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
          <div>
            <label className="block text-sm font-medium mb-2">Payment Methods</label>
            <div className="flex flex-col gap-1.5 mb-2">
              {localDraft.payment_methods.map((pm, i) => {
                const meta = paymentMethods.find((p) => String(p.id) === pm.payment_method_id)
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
                        setLocalDraft((f) => ({
                          ...f,
                          payment_methods: f.payment_methods.map((p, j) =>
                            j === i ? { ...p, partial_amount: e.target.value } : p
                          ),
                        }))
                      }
                      className="w-20 h-6 text-xs text-right px-1.5 bg-green-50 dark:bg-[#1a2e1a] border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
                    />
                    <button
                      type="button"
                      className="shrink-0 text-red-400 hover:text-red-300 text-xs px-1"
                      onClick={() =>
                        setLocalDraft((f) => ({
                          ...f,
                          payment_methods: f.payment_methods.filter((_, j) => j !== i),
                        }))
                      }
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
                if (!id || localDraft.payment_methods.some((pm) => pm.payment_method_id === id)) return
                setLocalDraft((f) => ({
                  ...f,
                  payment_methods: [...f.payment_methods, { payment_method_id: id, partial_amount: '' }],
                }))
              }}
              placeholder="Add payment method"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`is_paid_${expense.id}`}
              checked={localDraft.is_paid}
              onCheckedChange={(checked) => setLocalDraft((f) => ({ ...f, is_paid: Boolean(checked) }))}
            />
            <label htmlFor={`is_paid_${expense.id}`} className="text-sm font-medium cursor-pointer">
              Paid
            </label>
          </div>
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
                is_paid: localDraft.is_paid,
                is_saved: localDraft.is_saved,
                recurring_months: localDraft.recurring_months,
                payment_methods: localDraft.payment_methods,
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
