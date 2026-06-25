export interface ExpenseFilter {
  field: string
  op: string
  value: unknown
}

export type FilterType = 'text' | 'number' | 'boolean'

export const OPS_BY_TYPE: Record<FilterType, { op: string; label: string }[]> = {
  text: [
    { op: 'is_contains', label: 'contains' },
    { op: 'is_equal', label: 'equals' },
    { op: 'is_starts_with', label: 'starts with' },
    { op: 'is_ends_with', label: 'ends with' },
  ],
  number: [
    { op: 'is_equal', label: '=' },
    { op: 'is_greater', label: '>' },
    { op: 'is_greater_or_equal', label: '≥' },
    { op: 'is_lower', label: '<' },
    { op: 'is_lower_or_equal', label: '≤' },
    { op: 'is_between', label: 'between' },
  ],
  boolean: [{ op: 'is_equal', label: 'is' }],
}

function isActive(f: ExpenseFilter): boolean {
  if (f.value === '' || f.value === null || f.value === undefined) return false
  if (Array.isArray(f.value)) return f.value.every((v) => v !== '' && v !== null && v !== undefined)
  return true
}

export function buildFilterQuery(filters: ExpenseFilter[]):
  | { logic: 'AND'; conditions: ExpenseFilter[] }
  | undefined {
  const active = filters.filter(isActive)
  if (active.length === 0) return undefined
  return { logic: 'AND', conditions: active }
}
