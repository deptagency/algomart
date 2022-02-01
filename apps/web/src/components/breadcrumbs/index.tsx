import clsx from 'clsx'
import React from 'react'

import css from './breadcrumbs.module.css'

import AppLink from '@/components/app-link/app-link'

export interface BreadcrumbsProps {
  breadcrumbs: {
    label: string
    href?: string
  }[]
}

export default function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
  return (
    <nav>
      <ol className={css.breadcrumbs}>
        {breadcrumbs.map(({ href, label }) => (
          <li className={css.breadcrumb} key={label}>
            <AppLink
              className={clsx(css.link, { [css.current]: !href })}
              href={href || '#'}
            >
              {label}
            </AppLink>
          </li>
        ))}
      </ol>
    </nav>
  )
}
