'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses'
import { fmtMoney } from '@/lib/format'
import type { Expense, ExpensesResponse } from '@/types'
import { PaymentMethodCombobox } from '@/components/dashboard/PaymentMethodCombobox'
import { CategoryCombobox } from '@/components/dashboard/CategoryCombobox'
import { SaveChangesToast } from '@/components/dashboard/SaveChangesToast'
import { useCategories } from '@/hooks/use-categories'
import { usePeriod } from '@/providers/period-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
  category_id: number
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
      <col style={{ width: '19%' }} />
      <col style={{ width: '13%' }} />
      <col style={{ width: '9%' }} />
      <col style={{ width: '11%' }} />
      <col style={{ width: '9%' }} />
      <col style={{ width: '17%' }} />
      <col style={{ width: '5%' }} />
      <col style={{ width: '5%' }} />
      <col style={{ width: '12%' }} />
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
    category_id: parseInt(form.category_id, 10),
    date: form.date,
    is_recurring: form.is_recurring,
    is_paid: expense.is_paid,
    is_saved: expense.is_saved,
    payment_methods: form.payment_method_id
      ? [{ payment_method_id: parseInt(form.payment_method_id, 10), partial_amount: amount }]
      : [],
  }
}

export function ExpensesSection() {
  const qc = useQueryClient()
  const { data, isLoading } = useExpenses()
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const del = useDeleteExpense()
  const { date: periodDate } = usePeriod()

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<RowForm>(emptyForm)
  const [editing, setEditing] = useState<{ id: string; field: EditField } | null>(null)
  const [draft, setDraft] = useState<RowForm>(emptyForm)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)

  const expenses = data?.expenses ?? []
  const total = data?.total ?? expenses.reduce((sum, e) => sum + e.period_amount, 0)
  const isEmpty = !isLoading && !expenses.length && !isAdding

  const { data: categoriesData } = useCategories()
  const categoryNameById = new Map((categoriesData?.categories ?? []).map((c) => [String(c.id), c.name]))
  const usedCategoryIds = new Set(expenses.map((e) => String(e.category_id)))

  function applyOptimisticUpdate(payload: ExpenseUpdatePayload): ExpensesResponse | undefined {
    let snapshot: ExpensesResponse | undefined

    qc.setQueriesData<ExpensesResponse>({ queryKey: ['expenses'] }, (old) => {
      if (!old?.expenses) return old
      snapshot = old

      return {
        ...old,
        expenses: old.expenses.map((expense) => {
          if (expense.id !== payload.id) return expense

          const existingPaymentMethod = expense.payment_methods?.[0]
          const nextPaymentMethod = payload.payment_methods[0]

          return {
            ...expense,
            name: payload.name,
            amount: payload.amount,
            category_id: String(payload.category_id),
            date: payload.date,
            is_recurring: payload.is_recurring,
            payment_methods: nextPaymentMethod
              ? [{
                  payment_method_id: String(nextPaymentMethod.payment_method_id),
                  partial_amount: nextPaymentMethod.partial_amount,
                  name: existingPaymentMethod?.payment_method_id === String(nextPaymentMethod.payment_method_id)
                    ? existingPaymentMethod.name
                    : existingPaymentMethod?.name ?? '',
                  origin: existingPaymentMethod?.origin ?? '',
                  receiver: existingPaymentMethod?.receiver ?? null,
                }]
              : [],
          }
        }),
      }
    })

    return snapshot
  }

  function showSaveToast(payload: ExpenseUpdatePayload, onRevert: () => void) {
    toast.custom((t) => (
      <SaveChangesToast
        t={t}
        successMessage="Expense saved"
        onSave={async () => { await update.mutateAsync(payload) }}
        onRevert={onRevert}
      />
    ), { duration: Infinity })
  }

  function commitChanges(expense: Expense, form: RowForm) {
    if (!form.name.trim() || !form.category_id || !formHasChanges(expense, form)) return

    const payload = buildPayload(expense.id, form, expense)
    const oldData = applyOptimisticUpdate(payload)
    showSaveToast(payload, () => {
      if (oldData) qc.setQueriesData({ queryKey: ['expenses'] }, oldData)
    })
  }

  function startFieldEdit(expense: Expense, field: EditField) {
    setEditing({ id: expense.id, field })
    setDraft(formFromExpense(expense))
  }

  function handleCategoryChange(expenseId: string, categoryId: string) {
    const expense = expenses.find((e) => e.id === expenseId)
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
    const expense = expenses.find((e) => e.id === expenseId)
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
    const expense = expenses.find((e) => e.id === expenseId)
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
    if (!addForm.name.trim() || !addForm.amount || !addForm.category_id || !addForm.date) return
    const amount = parseFloat(addForm.amount)
    create.mutate(
      {
        name: addForm.name.trim(),
        amount,
        category_id: parseInt(addForm.category_id, 10),
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
                    <TableHead className="py-4 px-5 h-auto text-sm truncate">Name</TableHead>
                    <TableHead className="py-4 px-5 h-auto text-sm truncate">Category</TableHead>
                    <TableHead className="py-4 px-5 h-auto text-sm truncate text-right">Amount</TableHead>
                    <TableHead className="py-4 px-5 h-auto text-sm truncate">Date</TableHead>
                    <TableHead className="py-4 px-5 h-auto text-sm truncate text-center">Recurring</TableHead>
                    <TableHead className="py-4 px-5 h-auto text-sm truncate">Payment Method</TableHead>
                    <TableHead className="py-4 px-5 h-auto text-sm truncate text-center">Paid</TableHead>
                    <TableHead className="py-4 px-5 h-auto text-sm truncate text-center">Saved</TableHead>
                    <TableHead className="py-4 px-5 h-auto" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
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
                              className="w-full text-left truncate block text-green-700 dark:text-green-400 text-sm hover:text-green-600 dark:hover:text-green-300 transition-colors"
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
                          {isEditing && editing.field === 'date' ? (
                            <Input
                              type="date"
                              className="min-w-0 text-[1rem]"
                              value={draft.date}
                              onChange={(e) => setDraft((f) => ({ ...f, date: e.target.value }))}
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
                              className="w-full text-left truncate block text-green-700 dark:text-green-400 text-sm hover:text-green-600 dark:hover:text-green-300 transition-colors"
                              onClick={() => startFieldEdit(expense, 'date')}
                            >
                              {expense.date}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-5 px-5 text-center">
                          <Checkbox
                            checked={expense.is_recurring}
                            onCheckedChange={(checked) => {
                              update.mutate({ id: expense.id, is_recurring: Boolean(checked) })
                            }}
                          />
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
                              className="w-full text-left truncate block text-green-700 dark:text-green-400 text-sm hover:text-green-600 dark:hover:text-green-300 transition-colors"
                              onClick={() => startFieldEdit(expense, 'payment_method')}
                            >
                              {(expense.payment_methods ?? []).length > 0
                                ? (expense.payment_methods ?? []).map((pm) => pm.name).join(', ')
                                : <span className="text-green-300 dark:text-green-800">—</span>
                              }
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-5 px-5 text-center">
                          <Checkbox
                            checked={expense.is_paid}
                            onCheckedChange={(checked) => {
                              update.mutate({ id: expense.id, is_paid: Boolean(checked) })
                            }}
                          />
                        </TableCell>
                        <TableCell className="py-5 px-5 text-center">
                          <Checkbox
                            checked={expense.is_saved}
                            onCheckedChange={(checked) => {
                              update.mutate({ id: expense.id, is_saved: Boolean(checked) })
                            }}
                          />
                        </TableCell>
                        <TableCell className="py-5 px-5 text-right">
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
                        <Input
                          type="date"
                          className="min-w-0 text-[1rem]"
                          value={addForm.date}
                          onChange={(e) =>
                            setAddForm((f) => ({ ...f, date: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                      </TableCell>
                      <TableCell className="py-5 px-5 text-center">
                        <Checkbox
                          checked={addForm.is_recurring}
                          onCheckedChange={(checked) =>
                            setAddForm((f) => ({ ...f, is_recurring: Boolean(checked) }))
                          }
                        />
                      </TableCell>
                      <TableCell className="py-5 px-5">
                        <PaymentMethodCombobox
                          value={addForm.payment_method_id}
                          onChange={(v) => setAddForm((f) => ({ ...f, payment_method_id: v }))}
                        />
                      </TableCell>
                      <TableCell className="py-5 px-5" />
                      <TableCell className="py-5 px-5" />
                      <TableCell className="py-5 px-5">
                        <div className="flex gap-2 items-center">
                          {addForm.name.trim() && addForm.amount && addForm.category_id && addForm.date && (
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
                        colSpan={9}
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
                <TableFooter className="border-t-0 bg-transparent">
                  <TableRow className="total-row border-0">
                    <TableCell className="py-5 px-5 text-green-800 dark:text-green-300 font-semibold">TOTAL</TableCell>
                    <TableCell
                      colSpan={8}
                      className="py-5 px-5 text-right font-mono font-semibold text-green-800 dark:text-green-300"
                    >
                      {fmtMoney(total)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </table>
            )}
          </>
        )}
      </div>
    </section>
  )
}
