'use client'

import { useState } from 'react'
import { ArrowUp, ArrowDown, ChevronsUpDown, ListFilter } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OPS_BY_TYPE, type ExpenseFilter, type FilterType } from '@/lib/expense-filters'

interface FilterConfig {
  field: string
  type: FilterType
  value: ExpenseFilter | null
  onChange: (next: ExpenseFilter | null) => void
}

interface Props {
  label: string
  align?: 'left' | 'right' | 'center'
  sortKey?: string
  sort?: { key: string; dir: 'asc' | 'desc' } | null
  onSort?: (key: string) => void
  filter?: FilterConfig
}

export function ColumnHeader({ label, align = 'left', sortKey, sort, onSort, filter }: Props) {
  const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
  const sortable = !!sortKey && !!onSort
  const sortActive = sort && sortKey && sort.key === sortKey
  const filterActive = !!filter?.value

  return (
    <div className={`flex items-center gap-1 ${justify}`}>
      {sortable ? (
        <button
          type="button"
          onClick={() => onSort!(sortKey!)}
          className="inline-flex items-center gap-1 min-w-0 hover:text-white/90 transition-colors"
        >
          <span className="text-sm truncate">{label}</span>
          {sortActive ? (
            sort!.dir === 'asc' ? <ArrowUp className="size-3 shrink-0" /> : <ArrowDown className="size-3 shrink-0" />
          ) : (
            <ChevronsUpDown className="size-3 shrink-0 opacity-40" />
          )}
        </button>
      ) : (
        <span className="text-sm truncate">{label}</span>
      )}

      {filter && (
        <ColumnFilter config={filter} active={filterActive} />
      )}
    </div>
  )
}

function ColumnFilter({ config, active }: { config: FilterConfig; active: boolean }) {
  const ops = OPS_BY_TYPE[config.type]
  const [open, setOpen] = useState(false)
  const [op, setOp] = useState<string>(config.value?.op ?? ops[0].op)
  const [text, setText] = useState<string>(
    config.type !== 'number' && typeof config.value?.value === 'string' ? config.value.value : '',
  )
  const [num, setNum] = useState<string>(
    config.type === 'number' && !Array.isArray(config.value?.value) && config.value?.value != null
      ? String(config.value?.value)
      : '',
  )
  const [num2, setNum2] = useState<string>(
    config.type === 'number' && Array.isArray(config.value?.value) ? String((config.value!.value as unknown[])[1] ?? '') : '',
  )
  const [bool, setBool] = useState<string>(
    config.type === 'boolean' && typeof config.value?.value === 'boolean' ? String(config.value.value) : '',
  )

  function apply() {
    let value: unknown = ''
    if (config.type === 'text') value = text.trim()
    else if (config.type === 'boolean') value = bool === '' ? '' : bool === 'true'
    else if (op === 'is_between') value = [parseFloat(num), parseFloat(num2)]
    else value = num === '' ? '' : parseFloat(num)

    if (value === '' || (Array.isArray(value) && value.some((v) => Number.isNaN(v)))) {
      config.onChange(null)
    } else {
      config.onChange({ field: config.field, op, value })
    }
    setOpen(false)
  }

  function clear() {
    setText(''); setNum(''); setNum2(''); setBool('')
    config.onChange(null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={`shrink-0 rounded p-0.5 transition-colors ${active ? 'text-[#4ade80]' : 'text-white/50 hover:text-white/80'}`}
        aria-label={`Filter ${config.field}`}
      >
        <ListFilter className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" className="bg-white dark:bg-[#0f1a0f] border border-green-100 dark:border-[#166534] p-2 w-56 flex flex-col gap-2">
        {config.type === 'boolean' ? (
          <select
            className="h-8 text-sm bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5] rounded px-2 w-full"
            value={bool}
            onChange={(e) => setBool(e.target.value)}
          >
            <option value="">Any</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        ) : (
          <>
            <select
              className="h-8 text-sm bg-green-50 dark:bg-[#1a2e1a] border border-green-700 dark:border-[#166534] text-gray-900 dark:text-[#d1fae5] rounded px-2 w-full"
              value={op}
              onChange={(e) => setOp(e.target.value)}
            >
              {ops.map((o) => <option key={o.op} value={o.op}>{o.label}</option>)}
            </select>
            {config.type === 'text' ? (
              <Input className="h-8 text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Value…" autoFocus />
            ) : op === 'is_between' ? (
              <div className="flex items-center gap-1">
                <Input className="h-8 text-sm" type="number" value={num} onChange={(e) => setNum(e.target.value)} placeholder="min" />
                <span className="text-xs text-green-500">–</span>
                <Input className="h-8 text-sm" type="number" value={num2} onChange={(e) => setNum2(e.target.value)} placeholder="max" />
              </div>
            ) : (
              <Input className="h-8 text-sm" type="number" value={num} onChange={(e) => setNum(e.target.value)} placeholder="Value…" autoFocus />
            )}
          </>
        )}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={apply}>Apply</Button>
          <Button size="sm" variant="outline" onClick={clear}>Clear</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
