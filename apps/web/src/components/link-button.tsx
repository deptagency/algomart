import clsx from 'clsx'
import Link, { LinkProps } from 'next/link'
import { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'

import { ButtonBaseProps, buttonClasses } from './button'

import css from '@/components/button/button.module.css'

export type LinkButtonProps = LinkProps & {
  disabled?: boolean
} & ButtonBaseProps &
  Omit<
    DetailedHTMLProps<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      HTMLAnchorElement
    >,
    'href'
  >

export default function LinkButton({
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
  disablePadding,
  size = 'small',
  variant = 'primary',
  fullWidth,
  group,
  ...rest
}: LinkButtonProps) {
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
      <a
        className={clsx(
          'inline-block',
          buttonClasses({
            className,
            disablePadding,
            size,
            fullWidth,
            disabled,
            variant,
            group,
          })
        )}
        {...rest}
      >
        <span className={css.textWrapper}>{children}</span>
      </a>
    </Link>
  )
}
