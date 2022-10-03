import clsx from 'clsx'
import { useState } from 'react'

import css from './panel.module.css'

import { H2 } from '@/components/heading'

export interface PanelProps {
  className?: string
  contentRight?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  fullWidth?: boolean
  hScrollContent?: boolean
  openByDefault?: boolean
  title?: React.ReactNode
}

export default function Panel({
  className,
  contentRight,
  description,
  footer,
  fullWidth,
  hScrollContent,
  openByDefault = true,
  title,
  children,
}: React.PropsWithChildren<PanelProps>) {
  const [collapsed, setCollapsed] = useState(!openByDefault)
  const handleToggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  return (
    <section className={clsx(className, css.root)}>
      {title && (
        <header className={css.header}>
          <div className={css.contentLeft}>
            <H2 uppercase inheritColor>
              {title}
            </H2>
            {description && (
              <div className={css.description}>{description}</div>
            )}
          </div>
          <div className={css.contentRight}>
            {contentRight}
            <button
              className={css.collapseButton}
              onClick={handleToggleCollapse}
            >
              {collapsed ? '+' : <>&ndash;</>}
            </button>
          </div>
        </header>
      )}
      {!collapsed && (
        <div
          className={clsx({
            [css.padContent]: !fullWidth,
            [css.hScrollContent]: hScrollContent,
          })}
        >
          {children}
        </div>
      )}
      {footer && <div className={css.footer}>{footer}</div>}
    </section>
  )
}
