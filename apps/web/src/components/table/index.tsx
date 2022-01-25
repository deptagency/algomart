import clsx from 'clsx'
import { DetailedHTMLProps, TableHTMLAttributes } from 'react'

import { Table as TableElement, Tbody, Td, Th, Thead, Tr } from './elements'

export type ColumnDefinitionType<T, K extends keyof T> = {
  key: K
  name: string
  sortable?: boolean
  width?: number
}

export type TableProps<T, K extends keyof T> = {
  ariaLabel?: string
  data: Array<T>
  columns: Array<ColumnDefinitionType<T, K>>
}

function Table<T, K extends keyof T>({
  ariaLabel,
  className,
  columns,
  data,
  ...props
}: DetailedHTMLProps<TableHTMLAttributes<HTMLTableElement>, HTMLTableElement> &
  TableProps<T, K>) {
  return (
    <TableElement
      aria-label={ariaLabel}
      className={clsx('table-auto w-full', className)}
      {...props}
    >
      <Thead>
        <Tr>
          {columns.map(({ key, name }) => (
            <Th key={`th ${key}`}>{name}</Th>
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
