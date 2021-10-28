import { ReactNode } from 'react'

import AppFooterBottomNav from '@/components/app-footer/sections/app-footer-bottom-nav'
import AppHeader from '@/components/app-header/app-header'
import HeadTag from '@/components/head-tag/head-tag'

export interface ProfileLayoutProps {
  children?: ReactNode
  pageDescription?: string
  pageTitle?: string
}

export default function ProfileLayout({
  children,
  pageDescription,
  pageTitle,
}: ProfileLayoutProps) {
  return (
    <>
      <HeadTag pageDescription={pageDescription} pageTitle={pageTitle} />

      <div className="flex flex-col flex-grow text-white bg-black">
        <section>
          <AppHeader />

          {children}
        </section>
      </div>

      <div className="pb-8 text-white bg-black">
        <AppFooterBottomNav />
      </div>
    </>
  )
}
