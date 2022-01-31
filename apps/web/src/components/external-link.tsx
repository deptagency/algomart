import clsx from 'clsx'
import { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'

import css from './external-link.module.css'

export type ExternalLinkProps = DetailedHTMLProps<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>

export default function ExternalLink({
  children,
  className,
  rel: relation = 'noopener noreferrer',
  target = '_blank',
  ...rest
}: ExternalLinkProps) {
  return (
    <a
      className={clsx(css.link, className)}
      rel={relation}
      target={target}
      {...rest}
    >
      {children}
    </a>
  )
}
