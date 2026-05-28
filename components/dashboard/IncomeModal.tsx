'use client'

import { useEffect, useState } from 'react'
import {
  useSourcesOfIncome,
  useCreateSourceOfIncome,
  useUpdateSourceOfIncome,
  useDeleteSourceOfIncome,
} from '@/hooks/use-sources-of-income'
import { useCategories } from '@/hooks/use-categories'
import { fmtMoney } from '@/lib/format'

interface Props {
  open: boolean
  onClose: () => void
}

interface RowForm {
  name: string
  category_id: string
  income: string
}

const emptyForm: RowForm = { name: '', category_id: '', income: '' }

export function IncomeModal({ open, onClose }: Props) {
  const { data, isLoading } = useSourcesOfIncome()
  const { data: catData } = useCategories()
  const create = useCreateSourceOfIncome()
  const update = useUpdateSourceOfIncome()
  const del = useDeleteSourceOfIncome()

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<RowForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<RowForm>(emptyForm)

  const sources = data ? Object.values(data.sources_of_income).flat() : []
  const categories = catData?.categories ?? []
  const total = sources.reduce((sum, s) => sum + s.income, 0)

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  function handleAdd() {
    if (!addForm.name.trim() || !addForm.category_id) return
    create.mutate(
      {
        name: addForm.name.trim(),
        category_id: parseInt(addForm.category_id, 10),
        income: parseFloat(addForm.income) || 0,
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
    const source = sources.find((s) => s.id === id)
    if (!source) return
    setEditingId(id)
    setEditForm({
      name: source.name,
      category_id: source.category_id,
      income: String(source.income),
    })
  }

  function handleUpdate(id: string) {
    if (!editForm.name.trim()) return
    update.mutate(
      {
        id,
        name: editForm.name.trim(),
        category_id: parseInt(editForm.category_id, 10),
        income: parseFloat(editForm.income) || 0,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-200 dark:border-green-800">
          <h2 className="text-sm font-bold text-green-800 dark:text-green-400 uppercase tracking-wide">
            Income Sources
          </h2>
          <div className="flex items-center gap-2">
            <button
              className="btn-green"
              onClick={() => setIsAdding(true)}
              aria-label="Add income"
            >
              + Add Income
            </button>
            <button
              className="btn-ghost"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable table area */}
        <div className="overflow-auto flex-1">
          <table className="sheet-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Name</th>
                <th>Category</th>
                <th className="w-32 text-right">Amount</th>
                <th className="w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="text-center text-green-600 py-4">
                    Loading…
                  </td>
                </tr>
              )}
              {sources.map((source, index) => {
                const categoryName =
                  categories.find((c) => c.id === source.category_id)?.name ?? '—'
                return (
                  <tr key={source.id}>
                    <td className="text-green-600 text-center">{index + 1}</td>
                    <td>
                      {editingId === source.id ? (
                        <input
                          className="sheet-input"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, name: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate(source.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                        />
                      ) : (
                        source.name
                      )}
                    </td>
                    <td>
                      {editingId === source.id ? (
                        <select
                          className="sheet-input"
                          value={editForm.category_id}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, category_id: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                        >
                          <option value="">Select…</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        categoryName
                      )}
                    </td>
                    <td className="text-right">
                      {editingId === source.id ? (
                        <input
                          className="sheet-input text-right"
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.income}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, income: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate(source.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                        />
                      ) : (
                        <span className="font-mono">{fmtMoney(source.income)}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {editingId === source.id ? (
                          <>
                            <button
                              className="btn-green"
                              onClick={() => handleUpdate(source.id)}
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
                              onClick={() => startEdit(source.id)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-danger"
                              onClick={() => del.mutate(source.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {isAdding && (
                <tr className="add-row">
                  <td className="text-green-400 text-center">*</td>
                  <td>
                    <input
                      className="sheet-input"
                      placeholder="Source name"
                      value={addForm.name}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, name: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd()
                        if (e.key === 'Escape') {
                          setIsAdding(false)
                          setAddForm(emptyForm)
                        }
                      }}
                      autoFocus
                    />
                  </td>
                  <td>
                    <select
                      className="sheet-input"
                      value={addForm.category_id}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, category_id: e.target.value }))
                      }
                    >
                      <option value="">Select category…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="sheet-input text-right"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={addForm.income}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, income: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd()
                        if (e.key === 'Escape') {
                          setIsAdding(false)
                          setAddForm(emptyForm)
                        }
                      }}
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
              {sources.length > 0 && (
                <tr className="total-row">
                  <td />
                  <td colSpan={2} className="text-green-800 font-semibold">
                    TOTAL
                  </td>
                  <td className="text-right font-mono font-semibold text-green-800">
                    {fmtMoney(total)}
                  </td>
                  <td />
                </tr>
              )}
              {!isLoading && !sources.length && !isAdding && (
                <tr>
                  <td colSpan={5} className="text-center text-green-600 py-4 italic">
                    No income sources yet — add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
