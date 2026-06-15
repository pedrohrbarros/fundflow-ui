'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt } from 'lucide-react'

const links = [
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="w-56 shrink-0 border-r border-green-100 dark:border-green-900 bg-white dark:bg-gray-950 p-3 flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-green-100 dark:bg-[#14532d] text-green-900 dark:text-[#d1fae5]'
                : 'text-green-700 dark:text-[#86efac] hover:bg-green-50 dark:hover:bg-[#1a2e1a]'
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
