'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  t: number | string
  successMessage: string
  onSave: () => Promise<void>
  onRevert: () => void
}

export function SaveChangesToast({ t, successMessage, onSave, onRevert }: Props) {
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave()
      toast.custom(() => (
        <div className="flex items-center gap-3 bg-popover border border-border rounded-xl px-4 py-3 shadow-xl w-full">
          <span className="text-primary text-sm">✓</span>
          <p className="text-sm text-popover-foreground">{successMessage}</p>
        </div>
      ))
    } catch {
      onRevert()
      toast.error('Failed to save changes')
    } finally {
      toast.dismiss(t)
    }
  }

  return (
    <div className="flex items-center gap-4 bg-popover border border-border rounded-xl px-4 py-3 shadow-xl w-full">
      <p className="flex-1 text-sm text-popover-foreground">Save your changes?</p>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          className="h-7 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          onClick={handleSave}
          disabled={saving}
        >
          {saving && <Loader2 className="size-3 animate-spin" />}
          Save
        </button>
        <button
          type="button"
          className="h-7 px-3 text-sm font-medium rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer transition-colors disabled:opacity-50"
          onClick={() => { onRevert(); toast.dismiss(t) }}
          disabled={saving}
        >
          Discard
        </button>
      </div>
    </div>
  )
}
