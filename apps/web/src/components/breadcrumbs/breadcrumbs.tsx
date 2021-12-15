import { ChevronRightIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import React from 'react'

import css from './breadcrumbs.module.css'

import AppLink from '@/components/app-link/app-link'
import { isRootPathMatch } from '@/utils/urls'

export interface BreadcrumbsProps {
  breadcrumbs: {
    label: string
    isActive?: boolean
    isDisabled?: boolean
    handleClick?: () => void
    href?: string
  }[]
}

export default function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
  const router = useRouter()
  if (!breadcrumbs) return null
  return (
    <nav className={css.navigation}>
      <ol className={css.breadcrumbs}>
        {breadcrumbs.map(
          ({ isActive, isDisabled, label, handleClick, href }, index) => {
            const isCurrentNavItem = href
              ? isRootPathMatch(router.pathname, href)
              : false
            return (
              <React.Fragment key={index}>
                <li className={css.breadcrumb}>
                  {href ? (
                    <AppLink
                      className={clsx(css.mainNavLink, {
                        [css.mainNavLinkActive]: isCurrentNavItem,
                      })}
                      href={href}
                      key={href}
                    >
                      {label}
                    </AppLink>
                  ) : (
                    <button
                      className={clsx(css.navLink, {
                        [css.navLinkActive]: isActive,
                        [css.navLinkDisabled]: isDisabled,
                      })}
                      disabled={isDisabled}
                      onClick={handleClick}
                    >
                      {label}
                    </button>
                  )}
                </li>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRightIcon className={css.icon} />
                )}
              </React.Fragment>
            )
          }
        )}
      </ol>
    </nav>
  )
}
