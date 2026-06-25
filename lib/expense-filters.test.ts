import { describe, it, expect } from 'vitest'
import { buildFilterQuery, OPS_BY_TYPE } from './expense-filters'

describe('buildFilterQuery', () => {
  it('returns undefined when there are no active filters', () => {
    expect(buildFilterQuery([])).toBeUndefined()
    expect(buildFilterQuery([{ field: 'name', op: 'is_contains', value: '' }])).toBeUndefined()
  })
  it('wraps a single active filter in an AND group', () => {
    expect(buildFilterQuery([{ field: 'name', op: 'is_contains', value: 'rent' }])).toEqual({
      logic: 'AND',
      conditions: [{ field: 'name', op: 'is_contains', value: 'rent' }],
    })
  })
  it('includes multiple active filters', () => {
    const q = buildFilterQuery([
      { field: 'name', op: 'is_contains', value: 'rent' },
      { field: 'amount', op: 'is_greater', value: 100 },
    ])
    expect(q?.conditions).toHaveLength(2)
  })
})

describe('OPS_BY_TYPE', () => {
  it('lists ops per field type', () => {
    expect(OPS_BY_TYPE.text.map((o) => o.op)).toContain('is_contains')
    expect(OPS_BY_TYPE.number.map((o) => o.op)).toContain('is_between')
    expect(OPS_BY_TYPE.boolean.map((o) => o.op)).toEqual(['is_equal'])
  })
})
