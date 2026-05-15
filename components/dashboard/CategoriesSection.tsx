'use client'

import { useState } from 'react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories'

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
        <button
          className="btn-green"
          onClick={() => setIsAdding(true)}
          aria-label="Add category"
        >
          + Add Category
        </button>
      </div>

      <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
        <table className="sheet-table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Name</th>
              <th className="w-36">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3} className="text-center text-green-600 py-4">
                  Loading…
                </td>
              </tr>
            )}
            {data?.categories.map((category, index) => (
              <tr key={category.id}>
                <td className="text-green-600 text-center">{index + 1}</td>
                <td>
                  {editingId === category.id ? (
                    <input
                      className="sheet-input"
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
                </td>
                <td>
                  <div className="flex gap-1">
                    {editingId === category.id ? (
                      <>
                        <button
                          className="btn-green"
                          onClick={() => handleUpdate(category.id)}
                          aria-label="save"
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
                          onClick={() => startEdit(category.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => deleteCategory.mutate(category.id)}
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
                </td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-green" onClick={handleAdd} aria-label="save">
                      Save
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setIsAdding(false)
                        setAddName('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !data?.categories.length && !isAdding && (
              <tr>
                <td colSpan={3} className="text-center text-green-600 py-4 italic">
                  No categories yet — add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
