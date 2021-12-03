import { ChevronRightIcon } from '@heroicons/react/outline'
import clsx from 'clsx'

import css from './breadcrumbs.module.css'

export interface BreadcrumbsProps {
  breadcrumbs: {
    label: string
    handleClick?: () => void
  }[]
}

export default function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
  if (!breadcrumbs) return null
  return (
    <nav className={css.navigation}>
      <ol className={css.breadcrumbs}>
        {breadcrumbs.map(({ label, handleClick }, index) => {
          return (
            <li className={css.breadcrumb} key={index}>
              <button
                className={clsx(css.navLink, {
                  // [css.navLinkActive]: isCurrentNavItem,
                })}
                onClick={handleClick}
              >
                {label}
              </button>
              {index < breadcrumbs.length && <ChevronRightIcon />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
