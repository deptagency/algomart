import { ChevronRightIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { useRouter } from 'next/router'

import css from './breadcrumbs.module.css'

import AppLink from '@/components/app-link/app-link'
import { isRootPathMatch } from '@/utils/urls'

export interface BreadcrumbsProps {
  breadcrumbs: {
    label: string
    href?: string
    handleClick?: () => void
  }[]
}

export default function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
  const { pathname } = useRouter()
  if (!breadcrumbs) return null
  return (
    <nav className={css.navigation}>
      <ol className={css.breadcrumbs}>
        {breadcrumbs.map(({ label, href, handleClick }, index) => {
          const isCurrentNavItem = href
            ? isRootPathMatch(pathname, href)
            : false
          return (
            <li className={css.breadcrumb} key={href}>
              <AppLink
                className={clsx(css.navLink, {
                  [css.navLinkActive]: isCurrentNavItem,
                })}
                href={href}
                onClick={handleClick}
              >
                {label}
              </AppLink>
              {index < breadcrumbs.length && <ChevronRightIcon />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
