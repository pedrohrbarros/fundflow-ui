'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onChange: (categoryId: string) => void
  type: 'INCOME' | 'EXPENSE'
  usedCategoryIds?: Set<string>
  placeholder?: string
  autoOpen?: boolean
}

export function CategoryCombobox({
  value,
  onChange,
  type,
  usedCategoryIds = new Set<string>(),
  placeholder = 'Select category…',
  autoOpen = false,
}: Props) {
  const { data } = useCategories()
  const createCat = useCreateCategory()
  const updateCat = useUpdateCategory()
  const deleteCat = useDeleteCategory()

  const categories = (data?.categories ?? []).filter((c) => c.type === type)
  const selected = categories.find((c) => String(c.id) === value)

  const [open, setOpen] = useState(autoOpen)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isBusy = createCat.isPending || !!deletingId

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
    setDeletingId(id)
    deleteCat.mutate(id, { onSettled: () => setDeletingId(null) })
  }

  function handleCreate() {
    if (!newName.trim()) return
    createCat.mutate({ name: newName.trim(), type }, {
      onSuccess: (cat) => {
        onChange(String(cat.id))
        setShowNew(false)
        setNewName('')
        setOpen(false)
      },
    })
  }

  return (
    <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full text-left bg-transparent dark:bg-[#1a2e1a] border border-green-100 dark:border-[#166534] hover:border-green-400 dark:hover:border-[#4ade80] text-[1rem] h-8 px-2.5 rounded outline-none transition-colors flex items-center justify-between gap-2"
    >
      <span className={`flex-1 min-w-0 truncate ${selected ? 'text-green-900 dark:text-[#d1fae5]' : 'text-green-400/70 dark:text-[#86efac]/50'}`}>
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
        className="shrink-0 text-green-500 dark:text-[#86efac]"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(94vw,22rem)] bg-white dark:bg-[#0f1a0f] ring-green-700 dark:ring-[#166534] text-gray-900 dark:text-[#d1fae5] p-0 gap-0" showCloseButton={false}>
        <DialogTitle className="px-4 pt-4 pb-2">Select category</DialogTitle>
        <div className="max-h-72 overflow-y-auto">
          {categories.length === 0 && (
            <p className="text-green-400 dark:text-[#86efac]/50 text-xs italic px-3 py-3">No categories yet</p>
          )}
          <div
            className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer transition-colors ${value === '' ? 'bg-green-50 dark:bg-[#14532d]' : 'hover:bg-green-50/60 dark:hover:bg-[#1a3a1a]'}`}
            onClick={() => selectCategory('')}
          >
            <span className="flex-1 min-w-0 truncate text-sm italic text-green-500 dark:text-[#86efac]/70">No category</span>
          </div>
          {categories.map((cat) => {
            const catId = String(cat.id)
            return (
            <div
              key={catId}
              className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer group transition-colors ${
                catId === value
                  ? 'bg-green-50 dark:bg-[#14532d]'
                  : 'hover:bg-green-50/60 dark:hover:bg-[#1a3a1a]'
              }`}
              onClick={() => editingId !== catId && selectCategory(catId)}
            >
              {editingId === catId ? (
                <>
                  <Input
                    className="h-7 text-sm focus-visible:ring-0 min-w-0 flex-1 dark:bg-[#1a2e1a] dark:border-[#4ade80] dark:text-[#d1fae5]"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') saveEdit(catId)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  <Button
                    size="icon-xs"
                    className="shrink-0 bg-transparent border-0 text-green-600 dark:text-[#4ade80] hover:text-white hover:bg-green-600 dark:hover:bg-[#166534]"
                    onClick={(e) => { e.stopPropagation(); saveEdit(catId) }}
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
                  {!isBusy && (
                    <button
                      onClick={(e) => startEdit(catId, cat.name, e)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-green-500 dark:text-[#86efac] hover:text-white hover:bg-green-600 dark:hover:bg-[#166534] text-xs px-1.5 py-0.5 rounded transition-all"
                      title="Rename"
                    >
                      ✎
                    </button>
                  )}
                  {(deletingId === catId || (!isBusy && !usedCategoryIds.has(catId) && catId !== value)) && (
                    <button
                      onClick={(e) => handleDelete(catId, e)}
                      disabled={deleteCat.isPending}
                      className={`shrink-0 text-red-400 hover:text-red-200 hover:bg-red-950/40 text-xs px-1.5 py-0.5 rounded transition-all ${
                        deletingId === catId ? '' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title="Delete"
                    >
                      {deletingId === catId ? <Loader2 className="size-3 animate-spin" /> : '✕'}
                    </button>
                  )}
                </>
              )}
            </div>
            )
          })}
        </div>

        <div className="border-t border-green-100 dark:border-[#166534]">
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
                {createCat.isPending ? <Loader2 className="animate-spin" /> : '✓'}
              </Button>
              {!createCat.isPending && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="shrink-0 text-green-400 dark:text-[#86efac]/60 hover:text-foreground dark:hover:text-white dark:hover:bg-[#1a2e1a]"
                  onClick={() => { setShowNew(false); setNewName('') }}
                  title="Cancel"
                >
                  ✕
                </Button>
              )}
            </div>
          ) : !isBusy ? (
            <button
              onClick={(e) => { e.stopPropagation(); setShowNew(true); setEditingId(null) }}
              className="w-full text-left text-xs text-green-600 dark:text-[#86efac] hover:text-green-900 dark:hover:text-white hover:bg-green-50 dark:hover:bg-[#1a3a1a] px-3 py-2 transition-colors"
            >
              + New category
            </button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
