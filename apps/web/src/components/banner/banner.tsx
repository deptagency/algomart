import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './banner.module.css'

export interface BannerProps {
  inline?: boolean
  children?: ReactNode
  className?: string
}

export default function Banner({ inline, children, className }: BannerProps) {
  return (
    <section className={clsx(css.root, { [css.isInline]: inline })}>
      <div className={clsx(css.wrapper, className)}>{children}</div>
    </section>
  )
}
