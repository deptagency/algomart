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
  > & { underline?: boolean }

export default function AppLink({
  href,
  as,
  replace,
  shallow,
  children,
  className,
  underline,
  prefetch,
  passHref = true,
  scroll = true,
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
      <a
        className={clsx(
          css.root,
          { [css.textUnderline]: underline },
          className
        )}
        {...rest}
      >
        {children}
      </a>
    </Link>
  )
}
