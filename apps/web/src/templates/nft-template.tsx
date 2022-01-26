import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './nft-template.module.css'

import ButtonGroup from '@/components/button-group'
import Heading from '@/components/heading'
import LinkButton from '@/components/link-button'
import MediaGallery from '@/components/media-gallery/media-gallery'
import ReleaseDescription from '@/components/release-details/sections/release-description'
import { urls } from '@/utils/urls'

export interface NFTTemplateProps {
  collectible: CollectibleWithDetails
  userAddress?: string
}

export default function NFTTemplate({
  userAddress,
  collectible,
}: NFTTemplateProps) {
  const { t } = useTranslation()
  return (
    <div className={css.root}>
      <div className={css.panel}>
        <MediaGallery media={[collectible.image]} />

        <div className={css.panelHeader}>
          <Heading className={css.title}>{collectible.title}</Heading>
          {collectible.collection ? (
            <Heading className={css.subtitle} level={2} size={4}>
              {collectible.collection.name}
            </Heading>
          ) : null}
        </div>

        {userAddress ? (
          <div className={css.panelActions}>
            {/* TODO enable this for secondary marketplace */}
            <ButtonGroup>
              <LinkButton group="left" size="small" disabled href={urls.home}>
                {t('nft:actions.sellNFT')}
              </LinkButton>
              <LinkButton
                group="right"
                href={urls.nftTransfer
                  .replace(':templateId', collectible.templateId)
                  .replace(':assetId', String(collectible.address))}
                size="small"
                variant="secondary"
                disabled={
                  userAddress !== collectible.currentOwnerAddress ||
                  collectible.isFrozen
                }
              >
                {t('nft:actions.transferNFT')}
              </LinkButton>
            </ButtonGroup>
          </div>
        ) : null}

        {/* TODO: add tabs for description, activity, listings, and offers */}

        <ReleaseDescription description={collectible.body} />

        <div className={css.nftMeta}>
          <div className={css.nftMetaContent}>
            <ul role="list" className={css.nftMetaList}>
              {collectible.currentOwner ? (
                <li className={css.nftMetaListItem}>
                  <span className={css.nftMetaLabel}>
                    {t('nft:labels.Owner')}
                  </span>
                  <span>@{collectible.currentOwner}</span>
                </li>
              ) : null}
              {/* TODO: add publisher details */}
              {collectible.collection ? (
                <li className={css.nftMetaListItem}>
                  <span className={css.nftMetaLabel}>
                    {t('nft:labels.Collection')}
                  </span>
                  <span>{collectible.collection.name}</span>
                </li>
              ) : null}
              <li className={css.nftMetaListItem}>
                <span className={css.nftMetaLabel}>
                  {t('nft:labels.Edition')}
                </span>
                <span>
                  {t('nft:labels.editionX', {
                    edition: collectible.edition,
                    totalEditions: collectible.totalEditions,
                  })}
                </span>
              </li>
              {collectible.rarity ? (
                <li className={css.nftMetaListItem}>
                  <span className={css.nftMetaLabel}>
                    {t('nft:labels.Rarity')}
                  </span>
                  <span>{collectible.rarity.name}</span>
                </li>
              ) : null}
              <li className={css.nftMetaListItem}>
                <span className={css.nftMetaLabel}>
                  {t('nft:labels.Address')}
                </span>
                <span>{collectible.address}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
