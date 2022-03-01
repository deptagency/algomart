import css from './page.module.css'

import Heading from '@/components/heading'
import MainPanel from '@/components/main-panel/main-panel'
import FullBleedLayout from '@/layouts/full-bleed-layout'

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
  return (
    <FullBleedLayout pageTitle={title}>
      {heroBanner && (
        <div
          className={css.heroBanner}
          style={{ backgroundImage: `url(${heroBanner})` }}
        >
          <div className="max-w-5xl w-full m-auto text-left">
            <Heading level={1} size={60}>
              {heroBannerTitle || title}
            </Heading>
            <div className={css.heroBannerSubtitle}>{heroBannerSubtitle}</div>
          </div>
        </div>
      )}
      <MainPanel noPanel width="large">
        <div className="px-4">
          <div dangerouslySetInnerHTML={{ __html: body }} />
        </div>
      </MainPanel>
    </FullBleedLayout>
  )
}
