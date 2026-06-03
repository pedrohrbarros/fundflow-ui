'use client'

import { useState } from 'react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function CategoriesSection() {
  const { data, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [isAdding, setIsAdding] = useState(false)
  const [addName, setAddName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function handleAdd() {
    if (!addName.trim()) return
    createCategory.mutate(
      { name: addName.trim() },
      {
        onSuccess: () => {
          setAddName('')
          setIsAdding(false)
        },
      }
    )
  }

  function startEdit(id: string) {
    const category = data?.categories.find((c) => c.id === id)
    if (!category) return
    setEditingId(id)
    setEditName(category.name)
  }

  function handleUpdate(id: string) {
    if (!editName.trim()) return
    updateCategory.mutate(
      { id, name: editName.trim() },
      {
        onSuccess: () => {
          setEditingId(null)
          setEditName('')
        },
      }
    )
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-green-800 dark:text-green-400 uppercase tracking-wide">
          Categories
        </h2>
        <Button
          size="sm"
          onClick={() => setIsAdding(true)}
          aria-label="Add category"
        >
          + Add Category
        </Button>
      </div>

      <div className="border border-green-800 dark:border-green-800 rounded-lg overflow-hidden">
        <Table className="sheet-table">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="py-2 px-3 h-auto">Name</TableHead>
              <TableHead className="py-2 px-3 h-auto w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow className="border-0">
                <TableCell colSpan={2} className="py-4 px-3 text-center text-green-600">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {data?.categories.map((category) => (
              <TableRow key={category.id} className="border-0">
                <TableCell className="py-1 px-3">
                  {editingId === category.id ? (
                    <Input
                      className="h-7 text-sm min-w-0"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(category.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                    />
                  ) : (
                    category.name
                  )}
                </TableCell>
                <TableCell className="py-1 px-3">
                  <div className="flex gap-1">
                    {editingId === category.id ? (
                      <>
                        <Button
                          size="xs"
                          onClick={() => handleUpdate(category.id)}
                          aria-label="save"
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
                          onClick={() => startEdit(category.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => deleteCategory.mutate(category.id)}
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
                    placeholder="Category name"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd()
                      if (e.key === 'Escape') {
                        setIsAdding(false)
                        setAddName('')
                      }
                    }}
                    autoFocus
                  />
                </TableCell>
                <TableCell className="py-1 px-3">
                  <div className="flex gap-1">
                    <Button size="xs" onClick={handleAdd} aria-label="save">
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        setIsAdding(false)
                        setAddName('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !data?.categories.length && !isAdding && (
              <TableRow className="border-0">
                <TableCell colSpan={2} className="py-4 px-3 text-center text-green-600 italic">
                  No categories yet — add one above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
