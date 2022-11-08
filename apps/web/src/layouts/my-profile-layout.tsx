import { ReactNode } from 'react'

import DefaultLayout from './default-layout'

import css from './my-profile-layout.module.css'

import Loading from '@/components/loading/loading'
import MainPanel from '@/components/main-panel/main-panel'
import MainPanelHeader from '@/components/main-panel-header'
import MyProfileNav from '@/components/profile/my-profile-nav'
import NotAuthenticated from '@/components/profile/not-authenticated'
import { useAuth } from '@/contexts/auth-context'

export interface MyProfileLayoutProps {
  children?: ReactNode
  pageDescription?: string
  pageTitle: string
}

export default function MyProfileLayout({
  children,
  pageDescription,
  pageTitle,
}: MyProfileLayoutProps) {
  const { isAuthenticating, isAuthenticated } = useAuth()

  return (
    <DefaultLayout
      fullBleed
      pageDescription={pageDescription}
      pageTitle={pageTitle}
    >
      <MainPanel width="large">
        <MainPanelHeader title={pageTitle} />
        {isAuthenticating && <Loading className="my-32" />}
        {!isAuthenticating && !isAuthenticated && <NotAuthenticated />}
        {!isAuthenticating && isAuthenticated && (
          <>
            <MyProfileNav screen="mobile" />
            <div className={css.columns}>
              <section className={css.navColumn}>
                <MyProfileNav screen="desktop" />
              </section>
              <section className={css.contentColumn}>{children}</section>
            </div>
          </>
        )}
      </MainPanel>
    </DefaultLayout>
  )
}
