import clsx from 'clsx'
import {
  DetailedHTMLProps,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'

import css from './table.module.css'

export const Table: React.FC<
  DetailedHTMLProps<TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>
> = ({ className, children, ...rest }) => (
  <table className={clsx(className, css.table)} {...rest}>
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
> = ({ className, children, ...rest }) => (
  <th className={clsx(className, css.th)} scope="col" {...rest}>
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
