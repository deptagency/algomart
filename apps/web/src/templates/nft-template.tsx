import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './nft-template.module.css'

import Alert from '@/components/alert/alert'
import AppLink from '@/components/app-link/app-link'
import ButtonGroup from '@/components/button-group'
import ExternalLink from '@/components/external-link'
import Heading from '@/components/heading'
import LinkButton from '@/components/link-button'
import MediaGallery from '@/components/media-gallery/media-gallery'
import ReleaseDescription from '@/components/release-details/sections/release-description'
import { Environment } from '@/environment'
import { isAfterNow } from '@/utils/date-time'
import { urls } from '@/utils/urls'

export interface NFTTemplateProps {
  collectible: CollectibleWithDetails
  userAddress?: string
}

function getTransferrableStatus(
  collectible: CollectibleWithDetails,
  currentUserAddress?: string
) {
  if (!currentUserAddress) return 'noUser'
  if (collectible.currentOwnerAddress !== currentUserAddress) return 'notOwner'
  if (collectible.isFrozen) return 'frozen'
  if (isAfterNow(new Date(collectible.transferrableAt))) return 'mintedRecently'
  return 'canTransfer'
}

export default function NFTTemplate({
  userAddress,
  collectible,
}: NFTTemplateProps) {
  const { t } = useTranslation()
  const transferrableStatus = getTransferrableStatus(collectible, userAddress)
  const isTransferrable = transferrableStatus === 'canTransfer'
  const transferMessage = {
    frozen: t('nft:labels.cannotTransfer.frozen'),
    mintedRecently: t('nft:labels.cannotTransfer.mintedRecently', {
      date: new Date(collectible.transferrableAt).toLocaleString(),
    }),
  }[transferrableStatus]

  return (
    <div className={css.root}>
      <div className={css.panel}>
        {transferMessage ? (
          <Alert
            className={css.alert}
            content={transferMessage}
            centerContent
          />
        ) : null}

        <MediaGallery media={[collectible.image]} />

        <div className={css.panelHeader}>
          <Heading className={css.title}>{collectible.title}</Heading>
          {collectible.subtitle ? (
            <Heading className={css.subtitle} level={2} size={4}>
              {collectible.subtitle}
            </Heading>
          ) : null}
        </div>

        {userAddress && isTransferrable ? (
          <div className={css.panelActions}>
            {/* TODO: enable this for secondary marketplace */}
            <ButtonGroup>
              <LinkButton group="left" size="small" disabled href={urls.home}>
                {t('nft:actions.sellNFT')}
              </LinkButton>
              <LinkButton
                group="right"
                href={urls.nftTransfer.replace(
                  ':assetId',
                  String(collectible.address)
                )}
                size="small"
                variant="secondary"
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
                  <span>
                    <AppLink
                      href={urls.profileShowcase.replace(
                        ':username',
                        collectible.currentOwner
                      )}
                    >
                      @{collectible.currentOwner}
                    </AppLink>
                  </span>
                </li>
              ) : null}
              {/* TODO: add publisher details */}
              <CollectibleMetaListItem
                label={t('nft:labels.Collection')}
                value={collectible?.collection?.name}
              />
              <CollectibleMetaListItem
                label={t('nft:labels.Set')}
                value={collectible?.set?.name}
              />
              <CollectibleMetaListItem
                label={t('nft:labels.Edition')}
                value={t('nft:labels.editionX', {
                  edition: collectible.edition,
                  totalEditions: collectible.totalEditions,
                })}
              />
              <CollectibleMetaListItem
                label={t('nft:labels.Rarity')}
                value={collectible?.rarity?.name}
              />
              <CollectibleMetaListItem label={t('nft:labels.Address')}>
                <ExternalLink
                  href={`${Environment.algoExplorerBaseUrl}/asset/${collectible.address}`}
                >
                  {collectible.address}
                </ExternalLink>
              </CollectibleMetaListItem>
              <CollectibleMetaListItem
                label={t('nft:labels.uniqueId')}
                value={collectible?.uniqueCode}
              />
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ICollectibleMetaListItem {
  label: string
  value?: React.ReactNode
  children?: React.ReactNode
}

const CollectibleMetaListItem = ({
  label,
  value,
  children,
}: ICollectibleMetaListItem) =>
  children || value ? (
    <li className={css.nftMetaListItem}>
      <span className={css.nftMetaLabel}>{label}</span>
      <span>{children ?? value}</span>
    </li>
  ) : null
