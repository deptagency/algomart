import clsx from 'clsx'
import {
  DetailedHTMLProps,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'

import { TableElement, Td, Th,Thead, Tr } from './elements'

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
  hidden?: boolean
}

function Table<T, K extends keyof T>({
  ariaLabel, // Ex: List of assets (hidden)
  className,
  columns,
  data,
  hidden,
  ...props
}: DetailedHTMLProps<TableHTMLAttributes<HTMLTableElement>, HTMLTableElement> &
  DetailedHTMLProps<
    ThHTMLAttributes<HTMLTableHeaderCellElement>,
    HTMLTableHeaderCellElement
  > &
  DetailedHTMLProps<
    HTMLAttributes<HTMLTableSectionElement>,
    HTMLTableSectionElement
  > &
  DetailedHTMLProps<
    TdHTMLAttributes<HTMLTableDataCellElement>,
    HTMLTableDataCellElement
  > &
  DetailedHTMLProps<HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement> &
  TableProps<T, K>) {
  return (
    <TableElement
      aria-label={ariaLabel}
      className={clsx('table-auto w-full', className)}
      {...props}
    >
      {columns && columns.length > 0 && data && data.length > 0 && (
        <>
          <Thead className={clsx({ invisible: hidden === true })}>
            <tr>
              {columns.map(({ key, name }) => (
                <Th key={`th ${key}`}>{name}</Th>
              ))}
            </tr>
          </Thead>
          <tbody>
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
                {columns.map(({ key }, index) =>
                  index === 0 ? (
                    <Td key={`td ${key}`}>No results found.</Td>
                  ) : (
                    <Td aria-label="No value" key={`td ${key}`} />
                  )
                )}
              </Tr>
            )}
          </tbody>
        </>
      )}
    </TableElement>
  )
}

export { Table }

export default Table
