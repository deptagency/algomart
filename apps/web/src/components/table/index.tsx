import { ArrowUpIcon } from '@heroicons/react/outline'
import clsx from 'clsx'

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

export type ColumnDefinitionType<T, K extends keyof T> = {
  key: K
  name: string
  sortable?: boolean
  // tooltip?: React.ReactNode
  // stickLeft?: boolean
  // stickRight?: boolean
  // width?: number
}

export type TableProps<T, K extends keyof T> = {
  columns: Array<ColumnDefinitionType<T, K>>
  data: Array<T>
  onHeaderClick?: (col: ColumnDefinitionType<T, K>) => void
  sortDirection?: 'asc' | 'desc'
  sortBy?: string
}

function Table<T, K extends keyof T>({
  columns,
  data,
  sortDirection,
  sortBy,
  onHeaderClick,
  ...props
}: TableElementProps & TableProps<T, K>) {
  const getHeaderClickHandler = (col: ColumnDefinitionType<T, K>) =>
    col.sortable && onHeaderClick ? () => onHeaderClick(col) : undefined

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
                    [css.sortAsc]: sortDirection === 'asc',
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
                <Td key={`td ${key}`}>{row[key]}</Td>
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
