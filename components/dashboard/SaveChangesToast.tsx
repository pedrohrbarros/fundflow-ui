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
        <div className="flex items-center gap-3 bg-[#0f1a0f] border border-[#166534] rounded-xl px-4 py-3 shadow-xl w-full">
          <span className="text-[#4ade80] text-sm">✓</span>
          <p className="text-sm text-[#d1fae5]">{successMessage}</p>
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
    <div className="flex items-center gap-4 bg-[#0f1a0f] border border-[#166534] rounded-xl px-4 py-3 shadow-xl w-full">
      <p className="flex-1 text-sm text-[#d1fae5]">Save your changes?</p>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          className="h-7 px-3 text-sm font-medium rounded-lg bg-[#166534] text-[#d1fae5] hover:bg-[#14532d] cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          onClick={handleSave}
          disabled={saving}
        >
          {saving && <Loader2 className="size-3 animate-spin" />}
          Save
        </button>
        <button
          type="button"
          className="h-7 px-3 text-sm font-medium rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 cursor-pointer transition-colors disabled:opacity-50"
          onClick={() => { onRevert(); toast.dismiss(t) }}
          disabled={saving}
        >
          Discard
        </button>
      </div>
    </div>
  )
}
