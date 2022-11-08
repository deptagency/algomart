import { SortDirection } from '@algomart/schemas'
import { ArrowUpIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import get from 'lodash/get'
import useTranslation from 'next-translate/useTranslation'

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
  renderer?: (params: {
    value: string | number | boolean
    item: T
    colKey: string
  }) => React.ReactNode
}

export type TableProps<T> = {
  columns: Array<ColumnDefinitionType<T>>
  data: Array<T>
  noOuterBorder?: boolean
  onHeaderClick?: (col: ColumnDefinitionType<T>) => void
  onRowClick?: (row: T) => void
  sortDirection?: SortDirection
  sortBy?: string
}

function Table<T>({
  className,
  columns,
  data,
  noOuterBorder,
  sortDirection,
  sortBy,
  onHeaderClick,
  onRowClick,
  ...props
}: TableElementProps & TableProps<T>) {
  const { t } = useTranslation()
  const getHeaderClickHandler = (col: ColumnDefinitionType<T>) =>
    col.sortable && onHeaderClick ? () => onHeaderClick(col) : undefined

  const getRowClickHandler = (row: T) =>
    onRowClick ? () => onRowClick(row) : undefined

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
    <TableElement
      {...props}
      className={clsx(className, {
        [css.noOuterBorder]: noOuterBorder,
      })}
    >
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
            <Tr key={`tr ${index}`} onClick={getRowClickHandler(row)}>
              {columns.map(({ key }) => (
                <Td key={`td ${key}`}>{renderCell(row, key)}</Td>
              ))}
            </Tr>
          ))
        ) : (
          <Tr key="noResults">
            <Td className={css.noResults} colSpan={columns.length}>
              {t('common:statuses.No results')}
            </Td>
          </Tr>
        )}
      </Tbody>
    </TableElement>
  )
}

export { Table }

export default Table
