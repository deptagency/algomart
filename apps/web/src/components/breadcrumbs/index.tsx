import { ChevronRightIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import React from 'react'

import css from './breadcrumbs.module.css'

import AppLink from '@/components/app-link/app-link'
import { isMatchingQueryParams } from '@/utils/urls'

export interface BreadcrumbsProps {
  breadcrumbs: {
    label: string
    href: string
    handleClick?: () => void
  }[]
}

export default function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
  const { asPath } = useRouter()
  if (!breadcrumbs) return null
  return (
    <nav className={css.navigation}>
      <ol className={css.breadcrumbs}>
        {breadcrumbs.map(({ href, label, handleClick }, index) => {
          const isCurrentNavItem = isMatchingQueryParams(asPath, href)
          return (
            <React.Fragment key={index}>
              <li className={css.breadcrumb}>
                <AppLink
                  className={clsx(css.navLink, {
                    [css.navLinkActive]: isCurrentNavItem,
                  })}
                  href={href}
                  onClick={handleClick}
                >
                  {label}
                </AppLink>
              </li>
              {index < breadcrumbs.length - 1 && (
                <ChevronRightIcon className={css.icon} />
              )}
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
