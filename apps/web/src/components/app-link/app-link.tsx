import clsx from 'clsx'
import Link, { LinkProps as NextLinkProps } from 'next/link'
import { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'

import { useLocale } from '@/hooks/use-locale'

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
  const locale = useLocale()
  return (
    <Link
      href={href}
      as={as}
      locale={locale}
      passHref={passHref}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
    >
      <a className={clsx(className)} {...rest}>
        {children}
      </a>
    </Link>
  )
}
