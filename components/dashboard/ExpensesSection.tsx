'use client'

import { useState } from 'react'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses'
import { fmtMoney } from '@/lib/format'
import { PaymentMethodCombobox } from '@/components/dashboard/PaymentMethodCombobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface RowForm {
  name: string
  amount: string
  is_paid: boolean
  is_saved: boolean
  payment_method_id: string
}

const emptyForm: RowForm = { name: '', amount: '', is_paid: false, is_saved: false, payment_method_id: '' }

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

  function handleAdd() {
    if (!addForm.name.trim() || !addForm.amount) return
    const amount = parseFloat(addForm.amount)
    create.mutate(
      {
        name: addForm.name.trim(),
        amount,
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
        <div className={`overflow-auto min-h-0${isEmpty ? '' : ' flex-1'}`}>
          <Table className="sheet-table">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="py-4 px-5 h-auto">Name</TableHead>
                <TableHead className="py-4 px-5 h-auto w-32 text-right">Amount</TableHead>
                <TableHead className="py-4 px-5 h-auto">Payment Method</TableHead>
                <TableHead className="py-4 px-5 h-auto w-16 text-center">Paid</TableHead>
                <TableHead className="py-4 px-5 h-auto w-16 text-center">Saved</TableHead>
                <TableHead className="py-4 px-5 h-auto w-36">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow className="border-0">
                  <TableCell colSpan={6} className="py-6 px-5 text-center text-green-600">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
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
                  className="border-0 cursor-pointer group"
                  onClick={() => setIsAdding(true)}
                >
                  <TableCell
                    colSpan={6}
                    className="py-4 px-5 text-green-400/60 dark:text-green-700 select-none group-hover:text-green-600 dark:group-hover:text-green-500 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-base leading-none font-light">+</span>
                      <span className="italic">Add expense…</span>
                    </span>
                  </TableCell>
                </TableRow>
              )}
              {expenses.length > 0 && (
                <TableRow className="total-row border-0">
                  <TableCell className="py-5 px-5 text-green-800 dark:text-green-300 font-semibold">TOTAL</TableCell>
                  <TableCell className="py-5 px-5 text-right font-mono font-semibold text-green-800 dark:text-green-300">
                    {fmtMoney(total)}
                  </TableCell>
                  <TableCell colSpan={4} className="py-5 px-5" />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {isEmpty && (
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
        )}
      </div>
    </section>
  )
}
