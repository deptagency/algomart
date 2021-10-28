import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './main-panel.module.css'

export interface MainPanelProps {
  className?: string
  children?: ReactNode
  noPanel?: boolean
  panelPadding?: boolean
  width?: 'auto' | 'large' | 'full'
}

export default function MainPanel({
  className,
  children,
  noPanel,
  panelPadding,
  width = 'auto',
}: MainPanelProps) {
  return (
    <main
      className={clsx(
        {
          [css.rootNoPanel]: noPanel,
          [css.rootPanel]: !noPanel,
          [css.withPadding]: panelPadding,
          [css.largeWidth]: width === 'large',
          [css.fullWidth]: width === 'full',
        },
        className
      )}
    >
      {children}
    </main>
  )
}
