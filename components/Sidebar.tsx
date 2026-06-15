'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PanelLeft, PanelLeftClose, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'sidebar-collapsed'

const links = [
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCollapsed(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <nav
      className={cn(
        'shrink-0 border-r border-green-100 dark:border-green-900 bg-white dark:bg-gray-950 p-3 flex flex-col gap-2 transition-[width] duration-200 ease-in-out overflow-hidden',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex flex-col gap-1 flex-1 min-h-0">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              className={cn(
                'flex items-center rounded-lg py-2 text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                active
                  ? 'bg-green-100 dark:bg-[#14532d] text-green-900 dark:text-[#d1fae5]'
                  : 'text-green-700 dark:text-[#86efac] hover:bg-green-50 dark:hover:bg-[#1a2e1a]'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </div>

      {mounted && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'shrink-0 text-green-700 dark:text-[#86efac] hover:bg-green-50 dark:hover:bg-[#1a2e1a]',
            collapsed ? 'mx-auto' : 'self-end'
          )}
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      )}
    </nav>
  )
}
