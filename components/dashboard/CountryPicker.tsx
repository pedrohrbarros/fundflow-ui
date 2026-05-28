'use client'

import { useState, useRef, useEffect } from 'react'
import { useCurrentUser, useUpdateUserCountry } from '@/hooks/use-user'
import { COUNTRIES, getCountryByCode } from '@/lib/countries'

export function CountryPicker() {
  const { data: user } = useCurrentUser()
  const updateCountry = useUpdateUserCountry()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const currentCode = user?.country ?? 'BR'
  const currentCountry = getCountryByCode(currentCode)

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.currency.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleSelect(code: string) {
    updateCountry.mutate({ country: code })
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Select country and currency"
        title={currentCountry ? `${currentCountry.name} (${currentCountry.currency})` : 'Select country'}
        className="flex items-center justify-center size-9 rounded-full border border-green-200 dark:border-green-800 bg-white dark:bg-gray-950 hover:bg-green-50 dark:hover:bg-green-950 transition-colors text-lg"
      >
        {currentCountry?.flag ?? '🌍'}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-green-100 dark:border-green-800">
            <input
              autoFocus
              type="text"
              placeholder="Search country or currency…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-green-500"
            />
          </div>

          {/* Country list */}
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 px-3 py-4 text-center italic">No countries found</p>
            )}
            {filtered.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-green-50 dark:hover:bg-green-950 transition-colors ${
                  country.code === currentCode ? 'bg-green-100 dark:bg-green-900' : ''
                }`}
              >
                <span className="text-base shrink-0">{country.flag}</span>
                <span className="flex-1 min-w-0 truncate text-gray-900 dark:text-gray-100">
                  {country.name}
                </span>
                <span className="shrink-0 text-xs font-mono text-gray-500 dark:text-gray-400">
                  {country.currency}
                </span>
                {country.code === currentCode && (
                  <span className="shrink-0 text-green-600 dark:text-green-400 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
