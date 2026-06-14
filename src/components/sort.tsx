import { useMemo, useState } from 'react'
import { TableCell, TableSortLabel } from '@mui/material'

export type Order = 'asc' | 'desc'
export type SortValue = string | number | boolean | null | undefined

export interface SortState {
  readonly orderBy: string
  readonly order: Order
  readonly onSort: (key: string) => void
}

// compareValues orders two cell values: numbers numerically, booleans
// false<true, strings with a locale-aware numeric compare, and null/undefined
// always last (regardless of direction's later sign flip — they sort to the
// end of an ascending list).
function compareValues(a: SortValue, b: SortValue): number {
  const aEmpty = a === null || a === undefined || a === ''
  const bEmpty = b === null || b === undefined || b === ''
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? 1 : -1
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' })
}

// useSort keeps the active column/direction and returns a stably-sorted copy of
// `rows`. `getValue` maps a row + column key to a comparable value; define it at
// module scope so it stays referentially stable across renders.
export function useSort<T>(
  rows: readonly T[],
  getValue: (row: T, key: string) => SortValue,
  initialKey: string,
  initialOrder: Order = 'asc',
): { readonly sorted: readonly T[]; readonly sort: SortState } {
  const [orderBy, setOrderBy] = useState(initialKey)
  const [order, setOrder] = useState<Order>(initialOrder)

  const onSort = (key: string): void => {
    if (key === orderBy) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setOrderBy(key)
      setOrder('asc')
    }
  }

  const sorted = useMemo(() => {
    const dir = order === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => compareValues(getValue(a, orderBy), getValue(b, orderBy)) * dir)
  }, [rows, getValue, orderBy, order])

  return { sorted, sort: { orderBy, order, onSort } }
}

// SortCell is a table header cell that toggles sorting for `sortKey`.
export function SortCell({
  label,
  sortKey,
  sort,
  align,
}: {
  readonly label: string
  readonly sortKey: string
  readonly sort: SortState
  readonly align?: 'left' | 'right' | 'center'
}): JSX.Element {
  return (
    <TableCell align={align} sortDirection={sort.orderBy === sortKey ? sort.order : false}>
      <TableSortLabel
        active={sort.orderBy === sortKey}
        direction={sort.orderBy === sortKey ? sort.order : 'asc'}
        onClick={() => sort.onSort(sortKey)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  )
}
