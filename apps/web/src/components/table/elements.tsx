import clsx from 'clsx'
import {
  DetailedHTMLProps,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'

import css from './table.module.css'

export interface TableProps
  extends DetailedHTMLProps<
    TableHTMLAttributes<HTMLTableElement>,
    HTMLTableElement
  > {
  fixedLayout?: boolean
}

export const Table: React.FC<TableProps> = ({
  className,
  children,
  fixedLayout,
  ...rest
}: TableProps) => (
  <table
    className={clsx(className, css.table, {
      [css.fixedLayout]: fixedLayout,
    })}
    {...rest}
  >
    {children}
  </table>
)

export const Thead: React.FC<
  DetailedHTMLProps<
    HTMLAttributes<HTMLTableSectionElement>,
    HTMLTableSectionElement
  >
> = ({ className, children, ...rest }) => (
  <thead className={clsx(className, css.thead)} {...rest}>
    {children}
  </thead>
)

export const Tbody: React.FC<
  DetailedHTMLProps<
    HTMLAttributes<HTMLTableSectionElement>,
    HTMLTableSectionElement
  >
> = ({ className, children, ...rest }) => (
  <tbody className={clsx(className, css.tbody)} {...rest}>
    {children}
  </tbody>
)

export const Th: React.FC<
  DetailedHTMLProps<
    ThHTMLAttributes<HTMLTableHeaderCellElement>,
    HTMLTableHeaderCellElement
  >
> = ({ className, onClick, children, ...rest }) => (
  <th
    scope="col"
    onClick={onClick}
    className={clsx(css.th, className, {
      [css.sortable]: !!onClick,
      // [css.stickLeft]: stickLeft,
      // [css.stickRight]: stickRight,
    })}
    {...rest}
  >
    {children}
  </th>
)

export const Tr: React.FC<
  DetailedHTMLProps<HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>
> = ({ className, children, ...rest }) => (
  <tr className={clsx(className, css.tr)} {...rest}>
    {children}
  </tr>
)

export const Td: React.FC<
  DetailedHTMLProps<
    TdHTMLAttributes<HTMLTableDataCellElement>,
    HTMLTableDataCellElement
  >
> = ({ className, children, ...rest }) => (
  <td className={clsx(className, css.td)} {...rest}>
    {children}
  </td>
)
