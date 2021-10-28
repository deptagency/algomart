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
  featuredPack: PublishedPack | undefined
  upcomingPacks: PublishedPack[]
  notableCollectibles: CollectibleBase[]
  onClickFeatured: () => void
}

export default function HomeTemplate({
  featuredPack,
  upcomingPacks,
  notableCollectibles,
  onClickFeatured,
}: HomeTemplateProps) {
  const { t } = useTranslation()

  return (
    <>
      {featuredPack ? (
        <FeaturedPack
          featuredPack={featuredPack}
          onClickFeatured={onClickFeatured}
        />
      ) : null}

      {upcomingPacks.length > 0 ? (
        <>
          <Heading level={2} size={1} bold className={css.sectionTitle}>
            {t('release:Active & Upcoming Drops')}
          </Heading>

          <div className={css.upcomingPacks}>
            <Grid columns={3}>
              {upcomingPacks.map((pack) => (
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

      {notableCollectibles.length > 0 ? (
        <>
          <Heading level={2} size={1} bold className={css.sectionTitle}>
            {t('release:Notable Collectibles')}
          </Heading>

          <div className={css.notableCollectibles}>
            <Grid columns={4}>
              {notableCollectibles.map((collectible) => (
                <NotableCollectible
                  collectible={collectible}
                  key={collectible.templateId}
                />
              ))}
            </Grid>
          </div>
        </>
      ) : null}
    </>
  )
}
