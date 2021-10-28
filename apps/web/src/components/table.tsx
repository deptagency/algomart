import clsx from 'clsx'
import {
  DetailedHTMLProps,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'

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
    <table
      aria-label={ariaLabel}
      className={clsx('table-auto w-full', className)}
      {...props}
    >
      {columns && columns.length > 0 && data && data.length > 0 && (
        <>
          <thead className={clsx({ invisible: hidden === true })}>
            <tr>
              {columns.map(({ key, name }) => {
                return (
                  <th key={`th ${key}`} scope="col">
                    {name}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((row, index) => {
                return (
                  <tr key={`tr ${index}`}>
                    {columns.map(({ key }) => {
                      return <td key={`td ${key}`}>{row[key]}</td>
                    })}
                  </tr>
                )
              })
            ) : (
              <tr key="noResults">
                {columns.map(({ key }, index) =>
                  index === 0 ? (
                    <td key={`td ${key}`}>No results found.</td>
                  ) : (
                    <td aria-label="No value" key={`td ${key}`} />
                  )
                )}
              </tr>
            )}
          </tbody>
        </>
      )}
    </table>
  )
}

export { Table }
export default Table
