'use client'

import { useState } from 'react'
import { Loader2, MoreVertical } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
  useSourcesOfIncome,
  useCreateSourceOfIncome,
  useUpdateSourceOfIncome,
  useDeleteSourceOfIncome,
} from '@/hooks/use-sources-of-income'
import { fmtMoney } from '@/lib/format'
import { usePeriod } from '@/providers/period-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CategoryCombobox } from '@/components/dashboard/CategoryCombobox'

interface RowForm {
  name: string
  category_id: string
  income: string
  date: string
  is_recurring: boolean
}

const emptyForm: RowForm = { name: '', category_id: '', income: '', date: '', is_recurring: true }

export function IncomeSection() {
  const { date: periodDate } = usePeriod()
  const { data, isLoading } = useSourcesOfIncome()
  const create = useCreateSourceOfIncome()
  const update = useUpdateSourceOfIncome()
  const del = useDeleteSourceOfIncome()

  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState<RowForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<RowForm>(emptyForm)

  const sources = data ? data.sources_of_income.flatMap((g) => g.sources) : []
  const usedCategoryIds = new Set(sources.map((s) => String(s.category_id)))

  function handleAdd() {
    if (!addForm.name.trim()) return
    create.mutate(
      {
        name: addForm.name.trim(),
        category_id: addForm.category_id ? parseInt(addForm.category_id, 10) : null,
        income: parseFloat(addForm.income) || 0,
        date: addForm.date || periodDate,
        is_recurring: addForm.is_recurring,
      },
      {
        onSuccess: () => {
          setAddForm(emptyForm)
          setIsAdding(false)
        },
      }
    )
  }

  function handleUpdate(id: string) {
    if (!editForm.name.trim()) return
    update.mutate(
      {
        id,
        name: editForm.name.trim(),
        category_id: editForm.category_id ? parseInt(editForm.category_id, 10) : null,
        income: parseFloat(editForm.income) || 0,
        date: editForm.date,
        is_recurring: editForm.is_recurring,
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
            <Loader2 className="size-6 animate-spin text-green-600 dark:text-green-400" />
          </div>
        ) : (
        <Table className="sheet-table">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="py-2 px-3 h-auto">Name</TableHead>
              <TableHead className="py-2 px-3 h-auto">Category</TableHead>
              <TableHead className="py-2 px-3 h-auto w-32 text-right">Amount</TableHead>
              <TableHead className="py-2 px-3 h-auto text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
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
                    source.category_id ?? <span className="text-green-300 dark:text-green-800">—</span>
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
                    <span className="font-mono">{fmtMoney(source.period_amount)}</span>
                  )}
                </TableCell>
                <TableCell className="py-1 px-3 text-right">
                  <div className="flex gap-1 justify-end">
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
                        <IncomeExtraTools source={source} editForm={editForm} onEditFormChange={setEditForm} onUpdate={(updates) => update.mutate(updates)} />
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
                <TableCell className="py-1 px-3 text-right">
                  <div className="flex gap-1 justify-end">
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
            {!isLoading && !sources.length && !isAdding && (
              <TableRow className="border-0">
                <TableCell colSpan={4} className="py-4 px-3 text-center text-green-600 italic">
                  No income sources yet — add one above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
      </div>
    </section>
  )
}

function IncomeExtraTools({
  source,
  editForm,
  onEditFormChange,
  onUpdate,
}: {
  source: { id: string; date: string; is_recurring: boolean }
  editForm: RowForm
  onEditFormChange: (form: RowForm) => void
  onUpdate: (updates: { id: string; date: string; is_recurring: boolean }) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="xs" className="border-white text-white hover:bg-white/10">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="bg-white dark:bg-[#0f1a0f] border border-green-100 dark:border-[#166534] p-4 w-64 text-gray-900 dark:text-[#d1fae5]">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <Input
              type="date"
              value={editForm.date || source.date}
              onChange={(e) => onEditFormChange({ ...editForm, date: e.target.value })}
              className="w-full bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_recurring"
              checked={editForm.is_recurring}
              onCheckedChange={(checked) => onEditFormChange({ ...editForm, is_recurring: Boolean(checked) })}
            />
            <label htmlFor="is_recurring" className="text-sm font-medium cursor-pointer">
              Recurring
            </label>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onUpdate({
                id: source.id,
                date: editForm.date || source.date,
                is_recurring: editForm.is_recurring,
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
