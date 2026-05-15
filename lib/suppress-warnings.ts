'use client'

// next-themes injects a <script> to prevent FOUC. React 19 warns about inline
// scripts in component trees (they don't re-execute on the client, which is
// intentional — the script already ran during SSR). Suppress this dev-only
// warning so it doesn't surface in the error overlay.
if (typeof window !== 'undefined') {
  const _error = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('script')) return
    _error(...args)
  }
}
