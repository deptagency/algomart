import { CollectibleBase, PublishedPack } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './home-template.module.css'

import AppLink from '@/components/app-link/app-link'
import NotableCollectible from '@/components/collectibles/collectible-notable'
import FeaturedPack from '@/components/featured-pack/featured-pack'
import Grid from '@/components/grid/grid'
import Heading from '@/components/heading'
import ReleaseItem from '@/components/releases/release-item'
import { urls } from '@/utils/urls'

export interface HomeTemplateProps {
  heroBannerTitle?: string
  heroBannerSubtitle?: string
  heroBanner?: string
  heroPack: PublishedPack | undefined
  featuredPacks: PublishedPack[]
  featuredCollectibles: CollectibleBase[]
  onClickFeatured: () => void
}

export default function HomeTemplate({
  heroPack,
  heroBannerTitle,
  heroBannerSubtitle,
  heroBanner,
  featuredPacks,
  featuredCollectibles,
  onClickFeatured,
}: HomeTemplateProps) {
  const { t } = useTranslation()

  return (
    <>
      {heroPack ? (
        <FeaturedPack
          banner={heroBanner}
          featuredPack={heroPack}
          onClickFeatured={onClickFeatured}
          subtitle={heroBannerSubtitle}
          title={heroBannerTitle}
        />
      ) : null}

      <div className="mx-auto max-w-wrapper">
        {featuredPacks.length > 0 ? (
          <>
            <Heading level={2} size={1} bold className={css.sectionTitle}>
              {t('release:Active & Upcoming Drops')}
            </Heading>

            <div className={css.featuredPacks}>
              <Grid columns={3}>
                {featuredPacks.map((pack) => (
                  <AppLink
                    key={pack.templateId}
                    href={urls.release.replace(':packSlug', pack.slug)}
                  >
                    <ReleaseItem pack={pack} />
                  </AppLink>
                ))}
              </Grid>
            </div>
          </>
        ) : null}

        {featuredCollectibles.length > 0 ? (
          <>
            <Heading level={2} size={1} bold className={css.sectionTitle}>
              {t('release:Notable Collectibles')}
            </Heading>

            <div className={css.featuredCollectibles}>
              <Grid columns={4}>
                {featuredCollectibles.map((collectible) => (
                  <NotableCollectible
                    collectible={collectible}
                    key={collectible.templateId}
                  />
                ))}
              </Grid>
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
