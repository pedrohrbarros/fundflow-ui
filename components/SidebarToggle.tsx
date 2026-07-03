'use client'

import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'sidebar-collapsed'

export function SidebarToggle() {
  const [collapsed, setCollapsed] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCollapsed(localStorage.getItem(STORAGE_KEY) !== 'false')
  }, [])

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
      className="sm:hidden text-green-700 dark:text-[#86efac] hover:bg-green-50 dark:hover:bg-white/10"
    >
      {collapsed ? <Menu className="size-5" /> : <X className="size-5" />}
    </Button>
  )
}
