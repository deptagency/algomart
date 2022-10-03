import clsx from 'clsx'
import { ReactNode, useEffect } from 'react'

import css from './default-layout.module.css'

import AppFooter from '@/components/app-footer/app-footer'
import AppHeader from '@/components/app-header/app-header'
import HeadTag from '@/components/head-tag/head-tag'
import MainPanel from '@/components/main-panel/main-panel'
import EmailVerificationPrompt from '@/components/profile/email-verification-prompt'

export interface DefaultLayoutProps {
  children?: ReactNode
  className?: string
  fullBleed?: boolean
  noPanel?: boolean
  pageDescription?: string
  pageTitle?: string
  panelPadding?: boolean // Apply horizontal padding when panel is present
  variant?: 'colorful' | 'plain' | 'gradient'
}

function handleScroll() {
  const root = document?.documentElement
  root?.style.setProperty('--scrollPosition', root?.scrollTop.toString())
}

function updateScrollLimit() {
  const root = document?.documentElement
  const footer = document.querySelector('#footer') as HTMLElement
  const scrollLimit =
    Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      root.clientHeight,
      root.scrollHeight,
      root.offsetHeight
    ) - window.innerHeight

  root?.style.setProperty('--scrollLimit', scrollLimit.toString())
  if (footer?.offsetHeight) {
    root?.style.setProperty('--footerHeight', footer.offsetHeight.toString())
  }
}

export default function DefaultLayout({
  children,
  className,
  fullBleed = false,
  noPanel,
  pageDescription,
  pageTitle,
  panelPadding,
  variant = 'gradient',
}: DefaultLayoutProps) {
  useEffect(() => {
    document.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', updateScrollLimit)
    updateScrollLimit()
    return () => {
      document.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateScrollLimit)
    }
  })

  return (
    <>
      <div className={css.outerContentContainer}>
        <HeadTag pageDescription={pageDescription} pageTitle={pageTitle} />
        <EmailVerificationPrompt />
        <AppHeader />
        {noPanel || fullBleed ? (
          <main
            className={clsx(className, {
              [css.main]: !fullBleed,
            })}
          >
            {children}
          </main>
        ) : (
          <MainPanel panelPadding={panelPadding}>{children}</MainPanel>
        )}
        <AppFooter id="footer" className={css.footer} />
      </div>
    </>
  )
}
