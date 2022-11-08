import clsx from 'clsx'

import css from './page.module.css'

import { H1, H2 } from '@/components/heading'
import DefaultLayout from '@/layouts/default-layout'

export interface PageProps {
  heroBanner?: string
  heroBannerTitle?: string
  heroBannerSubtitle?: string
  title: string
  body: string
}

export default function Page({
  title,
  body,
  heroBannerTitle,
  heroBannerSubtitle,
  heroBanner,
}: PageProps) {
  const hasBanner = !!heroBanner
  return (
    <DefaultLayout fullBleed pageTitle={title}>
      <div
        className={clsx(css.pageHero, {
          [css.hasBanner]: hasBanner,
        })}
        style={
          hasBanner ? { backgroundImage: `url(${heroBanner})` } : undefined
        }
      >
        <div className={css.heroBannerContent}>
          <H1>{heroBannerTitle || title}</H1>
          {heroBannerSubtitle && <H2>{heroBannerSubtitle}</H2>}
        </div>
      </div>

      <div
        className={css.pageContent}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </DefaultLayout>
  )
}
