import clsx from 'clsx'
import Link, { LinkProps as NextLinkProps } from 'next/link'
import { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'

import css from './app-link.module.css'

import { useLanguage } from '@/contexts/language-context'

export type AppLinkProps = NextLinkProps &
  Omit<
    DetailedHTMLProps<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      HTMLAnchorElement
    >,
    'href'
  >

export default function AppLink({
  href,
  as,
  passHref,
  prefetch,
  replace,
  scroll,
  shallow,
  children,
  className,
  ...rest
}: AppLinkProps) {
  const { language } = useLanguage()
  return (
    <Link
      href={href}
      as={as}
      locale={language}
      passHref={passHref}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
    >
      <a className={clsx(css.root, className)} {...rest}>
        {children}
      </a>
    </Link>
  )
}
