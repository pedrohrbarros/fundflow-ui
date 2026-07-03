'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PanelLeft, PanelLeftClose, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'sidebar-collapsed'

const links = [
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function Sidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Sidebar width is controlled by collapsed state on both mobile and desktop
  const effectiveCollapsed = collapsed

  useEffect(() => {
    setMounted(true)
    // Default to collapsed; only expand if the user explicitly expanded it before.
    setCollapsed(localStorage.getItem(STORAGE_KEY) !== 'false')

    // Listen for sidebar toggle events from SidebarToggle component
    const handleToggle = (event: CustomEvent) => {
      setCollapsed(event.detail.collapsed)
    }
    window.addEventListener('sidebar-toggle', handleToggle as EventListener)
    return () => window.removeEventListener('sidebar-toggle', handleToggle as EventListener)
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
        effectiveCollapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex flex-col gap-1 flex-1 min-h-0">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={effectiveCollapsed ? label : undefined}
              aria-label={effectiveCollapsed ? label : undefined}
              className={cn(
                'flex items-center rounded-lg py-2 text-sm font-medium transition-colors',
                effectiveCollapsed ? 'justify-center px-2' : 'gap-3 px-3',
                active
                  ? 'bg-green-100 dark:bg-[#14532d] text-green-900 dark:text-[#d1fae5]'
                  : 'text-green-700 dark:text-[#86efac] hover:bg-green-50 dark:hover:bg-[#1a2e1a]'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!effectiveCollapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </div>

      {mounted && !isMobile && (
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
