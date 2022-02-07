import clsx from 'clsx'

import css from './panel.module.css'

import Heading from '@/components/heading'

export interface PanelProps {
  className?: string
  contentRight?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  fullWidth?: boolean
  title?: React.ReactNode
}

export default function Panel({
  className,
  contentRight,
  description,
  footer,
  fullWidth,
  title,
  children,
}: React.PropsWithChildren<PanelProps>) {
  return (
    <section className={clsx(className, css.root)}>
      {title && (
        <header className={css.header}>
          <div className={css.contentLeft}>
            <Heading level={2} inheritColor>
              {title}
            </Heading>
            {description && (
              <div className={css.description}>{description}</div>
            )}
          </div>
          <div className={css.contentRight}>{contentRight}</div>
        </header>
      )}
      <div className={clsx({ [css.padContent]: !fullWidth })}>{children}</div>
      {footer && <div className={css.footer}>{footer}</div>}
    </section>
  )
}
