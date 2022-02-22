import { CollectibleBase, PublishedPack } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './home-template.module.css'

import Button from '@/components/button'
import NotableCollectible from '@/components/collectibles/collectible-notable'
import FeaturedPack from '@/components/featured-pack/featured-pack'
import FeaturedPacks from '@/components/featured-packs/featured-packs'
import Grid from '@/components/grid/grid'
import Heading from '@/components/heading'

export interface HomeTemplateProps {
  authenticated: boolean
  featuredCollectibles: CollectibleBase[]
  featuredCollectiblesSubtitle?: string
  featuredCollectiblesTitle?: string
  featuredPacks: PublishedPack[]
  featuredPacksSubtitle?: string
  featuredPacksTitle?: string
  heroBanner?: string
  heroBannerSubtitle?: string
  heroBannerTitle?: string
  heroPack: PublishedPack | undefined
  onClickFeatured: () => void
  onClickReleases: () => void
}

export default function HomeTemplate({
  authenticated,
  featuredCollectibles,
  featuredCollectiblesSubtitle,
  featuredCollectiblesTitle,
  featuredPacks,
  featuredPacksSubtitle,
  featuredPacksTitle,
  heroBanner,
  heroBannerSubtitle,
  heroBannerTitle,
  heroPack,
  onClickFeatured,
  onClickReleases,
}: HomeTemplateProps) {
  const { t } = useTranslation()

  return (
    <>
      {heroPack && (
        <FeaturedPack
          authenticated={authenticated}
          banner={heroBanner}
          featuredPack={heroPack}
          onClickFeatured={onClickFeatured}
          subtitle={heroBannerSubtitle}
          title={heroBannerTitle}
        />
      )}

      {featuredPacks.length > 0 && (
        <div className={css.whiteBackground}>
          <section className={css.section}>
            <p className={css.sectionSubtitle}>{featuredPacksSubtitle}</p>
            <Heading level={2} size={1} bold className={css.sectionTitle}>
              {featuredPacksTitle}
            </Heading>
            <FeaturedPacks featuredPacks={featuredPacks} />
            <Button className={css.sectionButton} onClick={onClickReleases}>
              {t('common:actions.Browse Latest Releases')}
            </Button>
          </section>
        </div>
      )}

      {featuredCollectibles.length > 0 && (
        <section className={css.section}>
          <p className={css.sectionSubtitle}>{featuredCollectiblesSubtitle}</p>
          <Heading level={2} size={1} bold className={css.sectionTitle}>
            {featuredCollectiblesTitle}
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
            <Button className={css.sectionButton} onClick={onClickReleases}>
              {t('common:actions.Start Collecting')}
            </Button>
          </div>
        </section>
      )}
    </>
  )
}
