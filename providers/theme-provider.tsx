'use client'

import React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// React 19's JSX types are stricter about children — use createElement to stay
// compatible with next-themes until it ships updated @types/react@19 types.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(
    NextThemesProvider,
    { attribute: 'class', defaultTheme: 'system', enableSystem: true },
    children
  )
}
