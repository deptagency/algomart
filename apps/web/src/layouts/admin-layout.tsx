import { ReactNode } from 'react'

import common from './common-layout-styles.module.css'

import AppFooter from '@/components/app-footer/app-footer'
import AppHeader from '@/components/app-header/app-header'
import HeadTag from '@/components/head-tag/head-tag'
import EmailVerification from '@/components/profile/email-verification'
import UntransferredPacks from '@/components/profile/untransferred-packs'

export interface AdminLayoutProps {
  children?: ReactNode
  pageDescription?: string
  pageTitle?: string
}

export default function AdminLayout({
  children,
  pageDescription,
  pageTitle,
}: AdminLayoutProps) {
  return (
    <>
      <HeadTag pageDescription={pageDescription} pageTitle={pageTitle} />
      <div className={common.backgroundGradient}>
        <EmailVerification />
        <UntransferredPacks />
        <section>
          <AppHeader />
          <div className="px-4 py-16 mx-auto max-w-wrapper">{children}</div>
        </section>
      </div>
      <AppFooter />
    </>
  )
}
