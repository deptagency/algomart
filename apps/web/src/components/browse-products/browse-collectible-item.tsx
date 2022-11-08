import { CollectibleListing } from '@algomart/schemas'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import AppLink from '../app-link/app-link'

import css from '@/components/browse-products/browse-product-item-common.module.css'

import Button from '@/components/button'
import Credits from '@/components/currency/credits'
import Pill from '@/components/pill'
import { urlFor } from '@/utils/urls'
import { urls } from '@/utils/urls'

export interface BrowseCollectibleItemProps {
  collectibleListing: CollectibleListing
}

export default function BrowseCollectibleItem({
  collectibleListing,
}: BrowseCollectibleItemProps) {
  const { t } = useTranslation()

  return (
    <AppLink
      key={collectibleListing.templateId}
      href={urlFor(urls.marketplaceListing, {
        uniqueCode: collectibleListing.uniqueCode,
      })}
    >
      <div className={clsx(css.root, 'group')}>
        <div className={css.imageWrapper}>
          <Image
            alt={collectibleListing.title}
            height={250}
            layout="responsive"
            objectFit="cover"
            src={collectibleListing.image}
            width={250}
          />
        </div>

        <div className={css.metadata}>
          <div className={css.metadataFlexTop}>
            <div className={css.pills}>
              {collectibleListing.rarity && (
                <Pill color={collectibleListing.rarity?.color} small>
                  {collectibleListing.rarity?.name}
                </Pill>
              )}
              <Pill small className={css.editionPill}>
                #{collectibleListing.edition} /{' '}
                {collectibleListing.totalEditions}
              </Pill>
            </div>

            {/* Title (Nested div is required for styles) */}
            <h4 className={css.title}>
              <div>{collectibleListing.title}</div>
            </h4>
          </div>

          <div className={css.metadataFlexBottom}>
            <div>
              {/* Pricing */}
              <div className={css.metadataPrice}>
                <Credits
                  prefix={t('nft:labels.Starting at')}
                  value={collectibleListing.price}
                />
              </div>

              {/* Action */}
              <div className={css.metadataAction}>
                <Button data-e2e="buy-markertplace-collectible" fullWidth>
                  {t('common:actions.Buy Now')}
                </Button>
              </div>

              {/* Collection */}
              {collectibleListing?.collection?.image && (
                <div className={css.metadataCollection}>
                  <div className={css.metadataCollectionImageContainer}>
                    <Image
                      alt={collectibleListing.collection.name}
                      height={32}
                      layout="fixed"
                      objectFit="cover"
                      src={collectibleListing.collection.image}
                      width={32}
                    />
                  </div>
                  <div className={css.metadataCollectionName}>
                    {collectibleListing.collection.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLink>
  )
}
