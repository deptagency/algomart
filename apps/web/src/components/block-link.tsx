import clsx from 'clsx'
import Link, { LinkProps } from 'next/link'
import { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'

export type BlockLinkProps = LinkProps & {
  disabled?: boolean
} & Omit<
    DetailedHTMLProps<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      HTMLAnchorElement
    >,
    'href'
  >

export default function BlockLink({
  children,
  className,
  href,
  as,
  replace,
  scroll,
  disabled,
  shallow,
  passHref,
  prefetch,
  locale,
  ...rest
}: BlockLinkProps) {
  return (
    <Link
      href={href}
      as={as}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      passHref={passHref}
      prefetch={prefetch}
      locale={locale}
    >
      <a className={clsx('block', className)} {...rest}>
        {children}
      </a>
    </Link>
  )
}
