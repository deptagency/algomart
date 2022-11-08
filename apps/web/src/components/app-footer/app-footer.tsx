import clsx from 'clsx'
import { DetailedHTMLProps, HTMLAttributes } from 'react'

import AppFooterBottomNav from './sections/app-footer-bottom-nav'
import AppFooterTopNav from './sections/app-footer-top-nav'

export type AppFooterProps = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>

export default function AppFooter({ className, ...rest }: AppFooterProps) {
  return (
    <footer className={clsx('bg-base-bgCard', className)} {...rest}>
      <AppFooterTopNav />
      <AppFooterBottomNav />
    </footer>
  )
}
