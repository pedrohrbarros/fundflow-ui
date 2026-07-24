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
      className="w-full text-left bg-transparent border border-input hover:border-ring text-[1rem] h-8 px-2.5 rounded outline-none transition-colors flex items-center justify-between gap-2"
    >
      <span className={`flex-1 min-w-0 truncate ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
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
        className="shrink-0 text-muted-foreground"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(94vw,22rem)] p-0 gap-0" showCloseButton={false}>
        <DialogTitle className="px-4 pt-4 pb-2">Select category</DialogTitle>
        <div className="max-h-72 overflow-y-auto">
          {categories.length === 0 && (
            <p className="text-muted-foreground text-xs italic px-3 py-3">No categories yet</p>
          )}
          <div
            className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer transition-colors ${value === '' ? 'bg-accent' : 'hover:bg-accent/60'}`}
            onClick={() => selectCategory('')}
          >
            <span className="flex-1 min-w-0 truncate text-sm italic text-muted-foreground">No category</span>
          </div>
          {categories.map((cat) => {
            const catId = String(cat.id)
            return (
            <div
              key={catId}
              className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer group transition-colors ${
                catId === value
                  ? 'bg-accent'
                  : 'hover:bg-accent/60'
              }`}
              onClick={() => editingId !== catId && selectCategory(catId)}
            >
              {editingId === catId ? (
                <>
                  <Input
                    className="h-7 text-sm focus-visible:ring-0 min-w-0 flex-1"
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
                    className="shrink-0 bg-transparent border-0 text-primary hover:text-primary-foreground hover:bg-primary"
                    onClick={(e) => { e.stopPropagation(); saveEdit(catId) }}
                    disabled={updateCat.isPending}
                    title="Save"
                  >
                    ✓
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                    title="Cancel"
                  >
                    ✕
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 min-w-0 text-sm text-foreground truncate">
                    {cat.name}
                  </span>
                  {!isBusy && (
                    <button
                      onClick={(e) => startEdit(catId, cat.name, e)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary-foreground hover:bg-primary text-xs px-1.5 py-0.5 rounded transition-all"
                      title="Rename"
                    >
                      ✎
                    </button>
                  )}
                  {(deletingId === catId || (!isBusy && !usedCategoryIds.has(catId) && catId !== value)) && (
                    <button
                      onClick={(e) => handleDelete(catId, e)}
                      disabled={deleteCat.isPending}
                      className={`shrink-0 text-destructive hover:bg-destructive/20 text-xs px-1.5 py-0.5 rounded transition-all ${
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

        <div className="border-t border-border">
          {showNew ? (
            <div className="flex items-center gap-1 px-2 py-1.5">
              <Input
                className="h-7 text-sm focus-visible:ring-0 min-w-0 flex-1"
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
                className="shrink-0 bg-transparent border-0 text-primary hover:text-primary-foreground hover:bg-primary"
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
                  className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent"
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
              className="w-full text-left text-xs text-primary hover:text-foreground hover:bg-accent px-3 py-2 transition-colors"
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
