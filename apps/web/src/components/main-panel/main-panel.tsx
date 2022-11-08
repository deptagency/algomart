import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './main-panel.module.css'

export interface MainPanelProps {
  className?: string
  children?: ReactNode
  panelPadding?: boolean
  width?: 'auto' | 'large'
}

export default function MainPanel({
  className,
  children,
  panelPadding,
  width = 'auto',
}: MainPanelProps) {
  return (
    <div className={css.viewportPadding}>
      <main
        className={clsx(
          css.panelContainer,
          {
            [css.withPadding]: panelPadding,
            [css.largeWidth]: width === 'large',
          },
          className
        )}
      >
        <div className={css.panel}>{children}</div>
      </main>
    </div>
  )
}
