'use client'

import { useState } from 'react'
import {
  useSourcesOfIncome,
  useCreateSourceOfIncome,
  useUpdateSourceOfIncome,
  useDeleteSourceOfIncome,
} from '@/hooks/use-sources-of-income'
import { fmtMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CategoryCombobox } from '@/components/dashboard/CategoryCombobox'

interface RowForm {
  name: string
  category_id: string
  income: string
}

const emptyForm: RowForm = { name: '', category_id: '', income: '' }

export function IncomeSection() {
  const { data, isLoading } = useSourcesOfIncome()
  const create = useCreateSourceOfIncome()
  const update = useUpdateSourceOfIncome()
  const del = useDeleteSourceOfIncome()

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<RowForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<RowForm>(emptyForm)

  const sources = data ? Object.values(data.sources_of_income).flat() : []
  const usedCategoryIds = new Set(sources.map((s) => String(s.category_id)))
  const total = sources.reduce((sum, s) => sum + s.income, 0)

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
    <section className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-green-800 dark:text-green-400 uppercase tracking-wide">
          Income Sources
        </h2>
        <Button
          size="sm"
          onClick={() => setIsAdding(true)}
          aria-label="Add income"
        >
          + Add Income
        </Button>
      </div>

      <div className="border border-green-700 dark:border-green-800 rounded-lg overflow-hidden">
        <Table className="sheet-table">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="py-2 px-3 h-auto">Name</TableHead>
              <TableHead className="py-2 px-3 h-auto">Category</TableHead>
              <TableHead className="py-2 px-3 h-auto w-32 text-right">Amount</TableHead>
              <TableHead className="py-2 px-3 h-auto w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow className="border-0">
                <TableCell colSpan={4} className="py-4 px-3 text-center text-green-600">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {sources.map((source) => (
              <TableRow key={source.id} className="border-0">
                <TableCell className="py-1 px-3">
                  {editingId === source.id ? (
                    <Input
                      className="h-7 text-sm min-w-0"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, name: e.target.value }))
                      }
                      autoFocus
                    />
                  ) : (
                    source.name
                  )}
                </TableCell>
                <TableCell className="py-1 px-3">
                  {editingId === source.id ? (
                    <CategoryCombobox
                      value={editForm.category_id}
                      onChange={(id) =>
                        setEditForm((f) => ({ ...f, category_id: id }))
                      }
                      type="INCOME"
                      usedCategoryIds={usedCategoryIds}
                    />
                  ) : (
                    source.category_id
                  )}
                </TableCell>
                <TableCell className="py-1 px-3 text-right">
                  {editingId === source.id ? (
                    <Input
                      type="number"
                      className="h-7 text-sm min-w-0 text-right"
                      min="0"
                      step="0.01"
                      value={editForm.income}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, income: e.target.value }))
                      }
                    />
                  ) : (
                    <span className="font-mono">{fmtMoney(source.income)}</span>
                  )}
                </TableCell>
                <TableCell className="py-1 px-3">
                  <div className="flex gap-1">
                    {editingId === source.id ? (
                      <>
                        <Button
                          size="xs"
                          onClick={() => handleUpdate(source.id)}
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
                          onClick={() => startEdit(source.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => del.mutate(source.id)}
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
                    placeholder="Source name"
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
                  <CategoryCombobox
                    value={addForm.category_id}
                    onChange={(id) =>
                      setAddForm((f) => ({ ...f, category_id: id }))
                    }
                    type="INCOME"
                    usedCategoryIds={usedCategoryIds}
                  />
                </TableCell>
                <TableCell className="py-1 px-3">
                  <Input
                    type="number"
                    className="h-7 text-sm min-w-0 text-right"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={addForm.income}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, income: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
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
            {sources.length > 0 && (
              <TableRow className="total-row border-0">
                <TableCell className="py-1 px-3 text-green-800 font-semibold" colSpan={2}>
                  TOTAL
                </TableCell>
                <TableCell className="py-1 px-3 text-right font-mono font-semibold text-green-800">
                  {fmtMoney(total)}
                </TableCell>
                <TableCell className="py-1 px-3" />
              </TableRow>
            )}
            {!isLoading && !sources.length && !isAdding && (
              <TableRow className="border-0">
                <TableCell colSpan={4} className="py-4 px-3 text-center text-green-600 italic">
                  No income sources yet — add one above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
