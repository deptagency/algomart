import { ReactNode } from 'react'

import HeadTag from '@/components/head-tag/head-tag'

export interface InterstitialLayoutProps {
  children?: ReactNode
  pageDescription?: string
  pageTitle?: string
}

export default function InterstitialLayout({
  children,
  pageDescription,
  pageTitle,
}: InterstitialLayoutProps) {
  return (
    <>
      <HeadTag pageDescription={pageDescription} pageTitle={pageTitle} />
      <div className="bg-base-gray-dark flex flex-col flex-grow">
        {children}
      </div>
    </>
  )
}
