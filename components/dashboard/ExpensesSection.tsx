'use client'

import { useState } from 'react'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses'
import { fmtMoney } from '@/lib/format'

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
        <button
          className="btn-green"
          onClick={() => setIsAdding(true)}
          aria-label="Add expense"
        >
          + Add Expense
        </button>
      </div>

      <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
        <table className="sheet-table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Name</th>
              <th className="w-32 text-right">Amount</th>
              <th className="w-16 text-center">Paid</th>
              <th className="w-16 text-center">Saved</th>
              <th className="w-36">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center text-green-600 py-4">
                  Loading…
                </td>
              </tr>
            )}
            {expenses.map((expense, index) => (
              <tr key={expense.id}>
                <td className="text-green-600 text-center">{index + 1}</td>
                <td>
                  {editingId === expense.id ? (
                    <input
                      className="sheet-input"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, name: e.target.value }))
                      }
                      autoFocus
                    />
                  ) : (
                    expense.name
                  )}
                </td>
                <td className="text-right">
                  {editingId === expense.id ? (
                    <input
                      className="sheet-input text-right"
                      type="number"
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
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={editingId === expense.id ? editForm.is_paid : expense.is_paid}
                    onChange={(e) => {
                      if (editingId === expense.id) {
                        setEditForm((f) => ({ ...f, is_paid: e.target.checked }))
                      } else {
                        update.mutate({ id: expense.id, is_paid: e.target.checked })
                      }
                    }}
                    className="accent-green-600 w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={editingId === expense.id ? editForm.is_saved : expense.is_saved}
                    onChange={(e) => {
                      if (editingId === expense.id) {
                        setEditForm((f) => ({ ...f, is_saved: e.target.checked }))
                      } else {
                        update.mutate({ id: expense.id, is_saved: e.target.checked })
                      }
                    }}
                    className="accent-green-600 w-4 h-4 cursor-pointer"
                  />
                </td>
                <td>
                  <div className="flex gap-1">
                    {editingId === expense.id ? (
                      <>
                        <button
                          className="btn-green"
                          onClick={() => handleUpdate(expense.id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn-ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-ghost"
                          onClick={() => startEdit(expense.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => del.mutate(expense.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {isAdding && (
              <tr className="add-row">
                <td className="text-green-400 text-center">*</td>
                <td>
                  <input
                    className="sheet-input"
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
                </td>
                <td>
                  <input
                    className="sheet-input text-right"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={addForm.amount}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={addForm.is_paid}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, is_paid: e.target.checked }))
                    }
                    className="accent-green-600 w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={addForm.is_saved}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, is_saved: e.target.checked }))
                    }
                    className="accent-green-600 w-4 h-4 cursor-pointer"
                  />
                </td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-green" onClick={handleAdd}>
                      Save
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setIsAdding(false)
                        setAddForm(emptyForm)
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {expenses.length > 0 && (
              <tr className="total-row">
                <td />
                <td className="text-green-800 font-semibold">TOTAL</td>
                <td className="text-right font-mono font-semibold text-green-800">
                  {fmtMoney(total)}
                </td>
                <td colSpan={3} />
              </tr>
            )}
            {!isLoading && !expenses.length && !isAdding && (
              <tr>
                <td colSpan={6} className="text-center text-green-600 py-4 italic">
                  No expenses yet — add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
