import {
  CollectibleBase,
  Pack,
  Product,
  ProductStatus,
  ProductType,
  PublishedPack,
} from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'

import css from './home-template.module.css'

import AppLink from '@/components/app-link/app-link'
import NotableCollectible from '@/components/collectibles/collectible-notable'
import FeaturedPack from '@/components/featured-pack/featured-pack'
import Grid from '@/components/grid/grid'
import Heading from '@/components/heading'
import ProductItem from '@/components/products/product-item'
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
  const [upcomingProducts, setUpcomingProducts] = useState<Product[]>([])

  useEffect(() => {
    setUpcomingProducts(
      upcomingPacks.map((pack) => ({
        ...pack,
        packSlug: pack.slug,
        status: pack.status as unknown as ProductStatus,
        type: pack.type as unknown as ProductType,
      }))
    )
  }, [upcomingPacks])

  return (
    <>
      {featuredPack ? (
        <FeaturedPack
          featuredPack={featuredPack}
          onClickFeatured={onClickFeatured}
        />
      ) : null}

      {upcomingProducts.length > 0 ? (
        <>
          <Heading level={2} size={1} bold className={css.sectionTitle}>
            {t('release:Active & Upcoming Drops')}
          </Heading>

          <div className={css.upcomingProducts}>
            <Grid columns={3}>
              {upcomingProducts.map((product) => (
                <AppLink
                  key={product.packSlug}
                  href={urls.pack.replace(':packSlug', product.packSlug)}
                >
                  <ProductItem product={product} />
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
