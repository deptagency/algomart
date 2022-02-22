import { ReactNode } from 'react'

import common from './common-layout-styles.module.css'

import AppFooter from '@/components/app-footer/app-footer'
import AppHeader from '@/components/app-header/app-header'
import HeadTag from '@/components/head-tag/head-tag'
import EmailVerification from '@/components/profile/email-verification'
import UntransferredPacks from '@/components/profile/untransferred-packs'

export interface FullBleedLayoutProps {
  children?: ReactNode
  pageDescription?: string
  pageTitle?: string
}

export default function FullBleedLayout({
  children,
  pageDescription,
  pageTitle,
}: FullBleedLayoutProps) {
  return (
    <>
      <HeadTag pageDescription={pageDescription} pageTitle={pageTitle} />
      <div className={common.backgroundGradient}>
        <EmailVerification />
        <UntransferredPacks />
        <section>
          <AppHeader />
          {children}
        </section>
      </div>
      <AppFooter />
    </>
  )
}
