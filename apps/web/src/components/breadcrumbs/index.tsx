import { ChevronRightIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import React from 'react'

import css from './breadcrumbs.module.css'

export interface BreadcrumbsProps {
  breadcrumbs: {
    label: string
    isActive: boolean
    isDisabled: boolean
    handleClick?: () => void
  }[]
}

export default function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
  if (!breadcrumbs) return null
  return (
    <nav className={css.navigation}>
      <ol className={css.breadcrumbs}>
        {breadcrumbs.map(
          ({ isActive, isDisabled, label, handleClick }, index) => {
            return (
              <React.Fragment key={index}>
                <li className={css.breadcrumb}>
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
