import clsx from 'clsx'
import { DetailedHTMLProps, TableHTMLAttributes } from 'react'

import css from './table.module.css'

export const TableElement: React.FC<
  DetailedHTMLProps<TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>
> = ({ className, children, ...rest }) => (
  <table className={clsx(className, css.table)} {...rest}>
    {children}
  </table>
)

export const Thead: React.FC<{ className?: string }> = ({
  className,
  children,
}) => <thead className={clsx(className, css.thead)}>{children}</thead>

export const Th: React.FC<{ className?: string }> = ({
  className,
  children,
}) => (
  <th className={clsx(className, css.th)} scope="col">
    {children}
  </th>
)

export const Tr: React.FC<{ className?: string }> = ({
  className,
  children,
}) => <tr className={clsx(className, css.tr)}>{children}</tr>

export const Td: React.FC<{ className?: string }> = ({
  className,
  children,
}) => (
  <td className={clsx(className, css.td)} role="cell">
    {children}
  </td>
)
