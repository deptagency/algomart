import { ChevronRightIcon } from '@heroicons/react/outline'
import clsx from 'clsx'

import css from './breadcrumbs.module.css'

// import AppLink from '@/components/app-link/app-link'
// import { isRootPathMatch } from '@/utils/urls'

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
              <>
                <li className={css.breadcrumb} key={index}>
                  <button
                    className={clsx(css.navLink, {
                      [css.navLinkActive]: isActive,
                      [css.navLinkDisabled]: isDisabled,
                    })}
                    onClick={handleClick}
                  >
                    {label}
                  </button>
                </li>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRightIcon className={css.icon} />
                )}
              </>
            )
          }
        )}
      </ol>
    </nav>
  )
}

/*
export default function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
  const { pathname } = useRouter()
  if (!breadcrumbs) return null
  return (
    <nav className={css.navigation}>
      <ol className={css.breadcrumbs}>
        {breadcrumbs.map(({ label, href, handleClick }, index) => {
          const isCurrentNavItem = href ? isRootPathMatch(pathname, href) : false
          return (
            <>
              <li className={css.breadcrumb} key={index}>
                {!href ? (
                  <button
                    className={clsx(css.navLink, {
                      [css.navLinkActive]: isCurrentNavItem,
                    })}
                    onClick={handleClick}
                  >
                    {label}
                  </button>
                ) : (
                  <AppLink
                    className={clsx(css.navLink, {
                      [css.navLinkActive]: isCurrentNavItem,
                    })}
                    href={href}
                    key={href}
                  >
                    {label}
                  </AppLink>
                )}
              </li>
              {index < breadcrumbs.length - 1 && <ChevronRightIcon className={css.icon} />}
            </>
          )
        })}
      </ol>
    </nav>
  )
}
*/
