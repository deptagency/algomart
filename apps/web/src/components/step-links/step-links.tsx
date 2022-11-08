import { ChevronRightIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import React from 'react'

import css from './step-links.module.css'

import AppLink from '@/components/app-link/app-link'
import { isMatchingQueryParams } from '@/utils/urls'

export interface StepLinksProps {
  links: {
    label: string
    href: string
    handleClick?: () => void
  }[]
}

export default function StepLinks({ links }: StepLinksProps) {
  const { asPath } = useRouter()
  if (!links) return null
  return (
    <nav className={css.root}>
      <ol className={css.stepLinks}>
        {links.map(({ href, label, handleClick }, index) => {
          const isCurrentNavItem = isMatchingQueryParams(asPath, href)
          return (
            <React.Fragment key={index}>
              <li className={css.stepLink}>
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
              {index < links.length - 1 && (
                <ChevronRightIcon className={css.icon} />
              )}
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
