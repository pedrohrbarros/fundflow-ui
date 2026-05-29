'use client'

import { useState } from 'react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onChange: (categoryId: string) => void
  placeholder?: string
}

export function CategoryCombobox({ value, onChange, placeholder = 'Select category…' }: Props) {
  const { data } = useCategories()
  const createCat = useCreateCategory()
  const updateCat = useUpdateCategory()
  const deleteCat = useDeleteCategory()

  const categories = data?.categories ?? []
  const selected = categories.find((c) => c.id === value)

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  function selectCategory(id: string) {
    onChange(id)
    setOpen(false)
    setEditingId(null)
    setShowNew(false)
  }

  function startEdit(catId: string, catName: string, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(catId)
    setEditName(catName)
    setShowNew(false)
  }

  function saveEdit(id: string) {
    if (!editName.trim()) return
    updateCat.mutate({ id, name: editName.trim() }, {
      onSuccess: () => setEditingId(null),
    })
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (id === value) onChange('')
    deleteCat.mutate(id)
  }

  function handleCreate() {
    if (!newName.trim()) return
    createCat.mutate({ name: newName.trim() }, {
      onSuccess: (cat) => {
        onChange(cat.id)
        setShowNew(false)
        setNewName('')
        setOpen(false)
      },
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-full text-left bg-transparent dark:bg-[#1a2e1a] border border-green-200 dark:border-[#166534] hover:border-green-400 dark:hover:border-[#4ade80] text-[1rem] h-8 px-2.5 rounded outline-none transition-colors flex items-center justify-between gap-2">
        <span className={selected ? 'text-green-900 dark:text-[#d1fae5]' : 'text-green-400/70 dark:text-[#86efac]/50'}>
          {selected?.name ?? placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-green-500 dark:text-[#86efac] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </PopoverTrigger>

      <PopoverContent align="start" side="bottom" className="bg-white dark:bg-[#0f1a0f] border border-green-200 dark:border-[#166534] p-0 w-56">
        <div className="max-h-52 overflow-y-auto">
          {categories.length === 0 && (
            <p className="text-green-400 dark:text-[#86efac]/50 text-xs italic px-3 py-3">No categories yet</p>
          )}
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer group transition-colors ${
                cat.id === value
                  ? 'bg-green-50 dark:bg-[#14532d]'
                  : 'hover:bg-green-50/60 dark:hover:bg-[#1a3a1a]'
              }`}
              onClick={() => editingId !== cat.id && selectCategory(cat.id)}
            >
              {editingId === cat.id ? (
                <>
                  <Input
                    className="h-7 text-sm focus-visible:ring-0 min-w-0 flex-1 dark:bg-[#1a2e1a] dark:border-[#4ade80] dark:text-[#d1fae5]"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') saveEdit(cat.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  <Button
                    size="icon-xs"
                    className="shrink-0 bg-transparent border-0 text-green-600 dark:text-[#4ade80] hover:text-white hover:bg-green-600 dark:hover:bg-[#166534]"
                    onClick={(e) => { e.stopPropagation(); saveEdit(cat.id) }}
                    disabled={updateCat.isPending}
                    title="Save"
                  >
                    ✓
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="shrink-0 text-green-400 dark:text-[#86efac]/60 hover:text-foreground dark:hover:text-white dark:hover:bg-[#1a2e1a]"
                    onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                    title="Cancel"
                  >
                    ✕
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 min-w-0 text-sm text-green-900 dark:text-[#d1fae5] truncate">
                    {cat.name}
                  </span>
                  {cat.id === value && (
                    <span className="shrink-0 text-green-600 dark:text-[#4ade80] text-xs mr-0.5">✓</span>
                  )}
                  <button
                    onClick={(e) => startEdit(cat.id, cat.name, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-green-500 dark:text-[#86efac] hover:text-white hover:bg-green-600 dark:hover:bg-[#166634] text-xs px-1.5 py-0.5 rounded transition-all"
                    title="Rename"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => handleDelete(cat.id, e)}
                    disabled={deleteCat.isPending}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-200 hover:bg-red-950/40 text-xs px-1.5 py-0.5 rounded transition-all"
                    title="Delete"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-green-200 dark:border-[#166534]">
          {showNew ? (
            <div className="flex items-center gap-1 px-2 py-1.5">
              <Input
                className="h-7 text-sm focus-visible:ring-0 min-w-0 flex-1 dark:bg-[#1a2e1a] dark:border-[#4ade80] dark:text-[#d1fae5] placeholder:text-green-300 dark:placeholder:text-[#86efac]/40"
                placeholder="Category name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') { setShowNew(false); setNewName('') }
                }}
                autoFocus
              />
              <Button
                size="icon-xs"
                className="shrink-0 bg-transparent border-0 text-green-600 dark:text-[#4ade80] hover:text-white hover:bg-green-600 dark:hover:bg-[#166534]"
                onClick={handleCreate}
                disabled={createCat.isPending || !newName.trim()}
                title="Create"
              >
                ✓
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                className="shrink-0 text-green-400 dark:text-[#86efac]/60 hover:text-foreground dark:hover:text-white dark:hover:bg-[#1a2e1a]"
                onClick={() => { setShowNew(false); setNewName('') }}
                title="Cancel"
              >
                ✕
              </Button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowNew(true); setEditingId(null) }}
              className="w-full text-left text-xs text-green-600 dark:text-[#86efac] hover:text-green-900 dark:hover:text-white hover:bg-green-50 dark:hover:bg-[#1a3a1a] px-3 py-2 transition-colors"
            >
              + New category
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
