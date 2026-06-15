'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses'
import { fmtMoney } from '@/lib/format'
import { PaymentMethodCombobox } from '@/components/dashboard/PaymentMethodCombobox'
import { CategoryCombobox } from '@/components/dashboard/CategoryCombobox'
import { useCategories } from '@/hooks/use-categories'
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
}

const emptyForm: RowForm = { name: '', amount: '', category_id: '', is_paid: false, is_saved: false, payment_method_id: '' }

function ExpensesTableColgroup() {
  return (
    <colgroup>
      <col style={{ width: '26%' }} />
      <col style={{ width: '14%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '20%' }} />
      <col style={{ width: '6%' }} />
      <col style={{ width: '6%' }} />
      <col style={{ width: '18%' }} />
    </colgroup>
  )
}

export function ExpensesSection() {
  const { data, isLoading } = useExpenses()
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const del = useDeleteExpense()

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<RowForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<RowForm>(emptyForm)

  const expenses = data?.expenses ?? []
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const isEmpty = !isLoading && !expenses.length && !isAdding

  const { data: categoriesData } = useCategories()
  const categoryNameById = new Map((categoriesData?.categories ?? []).map((c) => [String(c.id), c.name]))
  const usedCategoryIds = new Set(expenses.map((e) => String(e.category_id)))

  function handleAdd() {
    if (!addForm.name.trim() || !addForm.amount || !addForm.category_id) return
    const amount = parseFloat(addForm.amount)
    create.mutate(
      {
        name: addForm.name.trim(),
        amount,
        category_id: parseInt(addForm.category_id, 10),
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

  function startEdit(id: string) {
    const expense = expenses.find((e) => e.id === id)
    if (!expense) return
    setEditingId(id)
    setEditForm({
      name: expense.name,
      amount: String(expense.amount),
      category_id: String(expense.category_id ?? ''),
      is_paid: expense.is_paid,
      is_saved: expense.is_saved,
      payment_method_id: expense.payment_methods[0]?.payment_method_id ?? '',
    })
  }

  function handleUpdate(id: string) {
    if (!editForm.name.trim()) return
    const amount = parseFloat(editForm.amount) || 0
    update.mutate(
      {
        id,
        name: editForm.name.trim(),
        amount,
        category_id: editForm.category_id ? parseInt(editForm.category_id, 10) : undefined,
        is_paid: editForm.is_paid,
        is_saved: editForm.is_saved,
        payment_methods: editForm.payment_method_id
          ? [{ payment_method_id: parseInt(editForm.payment_method_id, 10), partial_amount: amount }]
          : [],
      },
      {
        onSuccess: () => {
          setEditingId(null)
          setEditForm(emptyForm)
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
              onClick={() => setIsAdding(true)}
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
                    <TableHead className="py-4 px-5 h-auto">Name</TableHead>
                    <TableHead className="py-4 px-5 h-auto">Category</TableHead>
                    <TableHead className="py-4 px-5 h-auto text-right">Amount</TableHead>
                    <TableHead className="py-4 px-5 h-auto">Payment Method</TableHead>
                    <TableHead className="py-4 px-5 h-auto text-center">Paid</TableHead>
                    <TableHead className="py-4 px-5 h-auto text-center">Saved</TableHead>
                    <TableHead className="py-4 px-5 h-auto">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id} className="border-0">
                  <TableCell className="py-5 px-5">
                    {editingId === expense.id ? (
                      <Input
                        className="min-w-0 text-[1rem]"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, name: e.target.value }))
                        }
                        autoFocus
                      />
                    ) : (
                      expense.name
                    )}
                  </TableCell>
                  <TableCell className="py-5 px-5">
                    {editingId === expense.id ? (
                      <CategoryCombobox
                        value={editForm.category_id}
                        onChange={(v) => setEditForm((f) => ({ ...f, category_id: v }))}
                        type="EXPENSE"
                        usedCategoryIds={usedCategoryIds}
                      />
                    ) : (
                      <span className="text-green-700 dark:text-green-400 text-sm">
                        {categoryNameById.get(String(expense.category_id)) ?? (
                          <span className="text-green-300 dark:text-green-800">—</span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-5 px-5 text-right">
                    {editingId === expense.id ? (
                      <Input
                        type="number"
                        className="min-w-0 text-right text-[1rem]"
                        value={editForm.amount}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, amount: e.target.value }))
                        }
                      />
                    ) : (
                      <span className="font-mono">{fmtMoney(expense.amount)}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-5 px-5">
                    {editingId === expense.id ? (
                      <PaymentMethodCombobox
                        value={editForm.payment_method_id}
                        onChange={(v) => setEditForm((f) => ({ ...f, payment_method_id: v }))}
                      />
                    ) : (
                      <span className="text-green-700 dark:text-green-400 text-sm">
                        {expense.payment_methods.length > 0
                          ? expense.payment_methods.map((pm) => pm.name).join(', ')
                          : <span className="text-green-300 dark:text-green-800">—</span>
                        }
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-5 px-5 text-center">
                    <Checkbox
                      checked={editingId === expense.id ? editForm.is_paid : expense.is_paid}
                      onCheckedChange={(checked) => {
                        if (editingId === expense.id) {
                          setEditForm((f) => ({ ...f, is_paid: Boolean(checked) }))
                        } else {
                          update.mutate({ id: expense.id, is_paid: Boolean(checked) })
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="py-5 px-5 text-center">
                    <Checkbox
                      checked={editingId === expense.id ? editForm.is_saved : expense.is_saved}
                      onCheckedChange={(checked) => {
                        if (editingId === expense.id) {
                          setEditForm((f) => ({ ...f, is_saved: Boolean(checked) }))
                        } else {
                          update.mutate({ id: expense.id, is_saved: Boolean(checked) })
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="py-5 px-5">
                    <div className="flex gap-2 items-center">
                      {editingId === expense.id ? (
                        <>
                          {editForm.name.trim() && (
                            <Button
                              size="default"
                              onClick={() => handleUpdate(expense.id)}
                            >
                              Save
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setEditingId(null)}
                            aria-label="Cancel"
                          >
                            ✕
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => startEdit(expense.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="default"
                            onClick={() => del.mutate(expense.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
                  <TableCell className="py-5 px-5" />
                  <TableCell className="py-5 px-5" />
                  <TableCell className="py-5 px-5">
                    <div className="flex gap-2 items-center">
                      {addForm.name.trim() && addForm.amount && addForm.category_id && (
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
                  className="border-0 cursor-pointer group"
                  onClick={() => setIsAdding(true)}
                >
                  <TableCell
                    colSpan={7}
                    className="py-4 px-5 text-green-400/60 dark:text-green-700 select-none group-hover:text-green-600 dark:group-hover:text-green-500 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-base leading-none font-light">+</span>
                      <span className="italic">Add expense…</span>
                    </span>
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
                    <TableCell className="py-5 px-5 text-right font-mono font-semibold text-green-800 dark:text-green-300">
                      {fmtMoney(total)}
                    </TableCell>
                    <TableCell colSpan={5} className="py-5 px-5" />
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
