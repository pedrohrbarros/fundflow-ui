'use client'

import { useState } from 'react'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses'
import { fmtMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface RowForm {
  name: string
  amount: string
  is_paid: boolean
  is_saved: boolean
}

const emptyForm: RowForm = { name: '', amount: '', is_paid: false, is_saved: false }

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

  function handleAdd() {
    if (!addForm.name.trim() || !addForm.amount) return
    create.mutate(
      {
        name: addForm.name.trim(),
        amount: parseFloat(addForm.amount),
        is_paid: addForm.is_paid,
        is_saved: addForm.is_saved,
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
    })
  }

  function handleUpdate(id: string) {
    if (!editForm.name.trim()) return
    update.mutate(
      {
        id,
        name: editForm.name.trim(),
        amount: parseFloat(editForm.amount) || 0,
        is_paid: editForm.is_paid,
        is_saved: editForm.is_saved,
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
    <section className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-green-800 dark:text-green-400 uppercase tracking-wide">
          Expenses
        </h2>
        <Button
          size="sm"
          onClick={() => setIsAdding(true)}
          aria-label="Add expense"
        >
          + Add Expense
        </Button>
      </div>

      <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
        <Table className="sheet-table">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="py-2 px-3 h-auto">Name</TableHead>
              <TableHead className="py-2 px-3 h-auto w-32 text-right">Amount</TableHead>
              <TableHead className="py-2 px-3 h-auto w-16 text-center">Paid</TableHead>
              <TableHead className="py-2 px-3 h-auto w-16 text-center">Saved</TableHead>
              <TableHead className="py-2 px-3 h-auto w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow className="border-0">
                <TableCell colSpan={5} className="py-4 px-3 text-center text-green-600">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {expenses.map((expense) => (
              <TableRow key={expense.id} className="border-0">
                <TableCell className="py-1 px-3">
                  {editingId === expense.id ? (
                    <Input
                      className="h-7 text-sm min-w-0"
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
                <TableCell className="py-1 px-3 text-right">
                  {editingId === expense.id ? (
                    <Input
                      type="number"
                      className="h-7 text-sm min-w-0 text-right"
                      min="0"
                      step="0.01"
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, amount: e.target.value }))
                      }
                    />
                  ) : (
                    <span className="font-mono">{fmtMoney(expense.amount)}</span>
                  )}
                </TableCell>
                <TableCell className="py-1 px-3 text-center">
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
                <TableCell className="py-1 px-3 text-center">
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
                <TableCell className="py-1 px-3">
                  <div className="flex gap-1">
                    {editingId === expense.id ? (
                      <>
                        <Button
                          size="xs"
                          onClick={() => handleUpdate(expense.id)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => startEdit(expense.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="xs"
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
                <TableCell className="py-1 px-3">
                  <Input
                    className="h-7 text-sm min-w-0"
                    placeholder="Expense name"
                    value={addForm.name}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, name: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd()
                      if (e.key === 'Escape') setIsAdding(false)
                    }}
                    autoFocus
                  />
                </TableCell>
                <TableCell className="py-1 px-3">
                  <Input
                    type="number"
                    className="h-7 text-sm min-w-0 text-right"
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
                <TableCell className="py-1 px-3 text-center">
                  <Checkbox
                    checked={addForm.is_paid}
                    onCheckedChange={(checked) =>
                      setAddForm((f) => ({ ...f, is_paid: Boolean(checked) }))
                    }
                  />
                </TableCell>
                <TableCell className="py-1 px-3 text-center">
                  <Checkbox
                    checked={addForm.is_saved}
                    onCheckedChange={(checked) =>
                      setAddForm((f) => ({ ...f, is_saved: Boolean(checked) }))
                    }
                  />
                </TableCell>
                <TableCell className="py-1 px-3">
                  <div className="flex gap-1">
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
            {expenses.length > 0 && (
              <TableRow className="total-row border-0">
                <TableCell className="py-1 px-3 text-green-800 dark:text-green-300 font-semibold">TOTAL</TableCell>
                <TableCell className="py-1 px-3 text-right font-mono font-semibold text-green-800 dark:text-green-300">
                  {fmtMoney(total)}
                </TableCell>
                <TableCell colSpan={3} className="py-1 px-3" />
              </TableRow>
            )}
            {!isLoading && !expenses.length && !isAdding && (
              <TableRow className="border-0">
                <TableCell colSpan={5} className="py-4 px-3 text-center text-green-600 italic">
                  No expenses yet — add one above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
