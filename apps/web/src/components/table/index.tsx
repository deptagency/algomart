import { SortDirection } from '@algomart/schemas'
import { ArrowUpIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import get from 'lodash.get'

import {
  Table as TableElement,
  TableProps as TableElementProps,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from './elements'

import css from './table.module.css'

export type ColumnDefinitionType<T> = {
  key: string
  name: string
  sortable?: boolean
  // tooltip?: React.ReactNode
  // stickLeft?: boolean
  // stickRight?: boolean
  // width?: number
  renderer?: ({ value: any, item: T, colKey: string }) => React.ReactNode
}

export type TableProps<T> = {
  columns: Array<ColumnDefinitionType<T>>
  data: Array<T>
  onHeaderClick?: (col: ColumnDefinitionType<T>) => void
  sortDirection?: SortDirection
  sortBy?: string
}

function Table<T>({
  columns,
  data,
  sortDirection,
  sortBy,
  onHeaderClick,
  ...props
}: TableElementProps & TableProps<T>) {
  const getHeaderClickHandler = (col: ColumnDefinitionType<T>) =>
    col.sortable && onHeaderClick ? () => onHeaderClick(col) : undefined

  const renderCell = (row: T, colKey: string) => {
    const value = get(row, colKey)
    const item = row
    let renderedValue = value
    const renderer = columns.find((col) => col.key === colKey)?.renderer
    if (renderer) {
      renderedValue = renderer({ value, item, colKey })
    }
    // null & undefined are rendered as a dim em-dash
    return renderedValue ?? <span className={css.nullish}>—</span>
  }

  return (
    <TableElement {...props}>
      <Thead>
        <Tr>
          {columns.map((col) => (
            <Th key={`th ${col.key}`} onClick={getHeaderClickHandler(col)}>
              {col.name}
              {sortBy === col.key && (
                <ArrowUpIcon
                  className={clsx(css.sortIcon, {
                    [css.sortAsc]: sortDirection === SortDirection.Ascending,
                  })}
                />
              )}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {data && data.length > 0 ? (
          data.map((row, index) => (
            <Tr key={`tr ${index}`}>
              {columns.map(({ key }) => (
                <Td key={`td ${key}`}>{renderCell(row, key)}</Td>
              ))}
            </Tr>
          ))
        ) : (
          <Tr key="noResults">
            <Td colSpan={columns.length}>No results found.</Td>
          </Tr>
        )}
      </Tbody>
    </TableElement>
  )
}

export { Table }

export default Table
