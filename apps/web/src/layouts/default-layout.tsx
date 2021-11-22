import { ReactNode } from 'react'

import common from './common-layout-styles.module.css'

import AppFooter from '@/components/app-footer/app-footer'
import AppHeader from '@/components/app-header/app-header'
import HeadTag from '@/components/head-tag/head-tag'
import MainPanel from '@/components/main-panel/main-panel'
import EmailVerification from '@/components/profile/email-verification'
import UntransferredPacks from '@/components/profile/untransferred-packs'

export interface DefaultLayoutProps {
  children?: ReactNode
  noPanel?: boolean
  pageDescription?: string
  pageTitle?: string
  panelPadding?: boolean // Apply horizontal padding when panel is present
  width?: 'auto' | 'large' | 'full'
}

export default function DefaultLayout({
  children,
  noPanel,
  pageDescription,
  pageTitle,
  panelPadding,
  width = 'auto',
}: DefaultLayoutProps) {
  return (
    <>
      <HeadTag pageDescription={pageDescription} pageTitle={pageTitle} />
      <div className={common.backgroundGradient}>
        <EmailVerification />
        <UntransferredPacks />

        <section>
          <AppHeader />

          <MainPanel
            noPanel={noPanel}
            panelPadding={panelPadding}
            width={width}
          >
            {children}
          </MainPanel>
        </section>
      </div>
      <AppFooter />
    </>
  )
}
