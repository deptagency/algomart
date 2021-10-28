import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './grid.module.css'

export interface GridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
}

export default function Grid({ children, columns = 4 }: GridProps) {
  return (
    <div
      className={clsx(css.root, {
        [css.columns2]: columns === 2,
        [css.columns3]: columns === 3,
        [css.columns4]: columns === 4,
      })}
    >
      {children}
    </div>
  )
}
