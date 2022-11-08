import {
  CollectibleActivity,
  CollectibleListingStatus,
  CollectibleWithDetails,
} from '@algomart/schemas'
import {
  ShoppingCartIcon,
  SparklesIcon,
  SwitchHorizontalIcon,
  TagIcon,
} from '@heroicons/react/outline'
import clsx from 'clsx'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'

import css from './nft-template.module.css'

import AlgoAddress from '@/components/algo-address'
import AppLink from '@/components/app-link/app-link'
import Async from '@/components/async/async'
import Avatar from '@/components/avatar/avatar'
import ExternalLink from '@/components/external-link'
import { H2, H3 } from '@/components/heading'
import LinkButton from '@/components/link-button'
import Alert from '@/components/list-collectible-form/alert'
import MediaGallery from '@/components/media-gallery/media-gallery'
import Pill from '@/components/pill'
import Table from '@/components/table'
import UserLink from '@/components/user-link/user-link'
import Video from '@/components/video'
import { AppConfig } from '@/config'
import { useAuth } from '@/contexts/auth-context'
import { useNFTActivities } from '@/hooks/api/use-nft-activities'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency } from '@/utils/currency'
import getPurchasableStatus, {
  PurchasableStatus,
} from '@/utils/get-purchasable-status'
import getTransferrableStatus, {
  TransferrableStatus,
} from '@/utils/get-transferrable-status'
import { urlFor, urls } from '@/utils/urls'

export interface NFTTemplateProps {
  collectible: CollectibleWithDetails
  currentOwnerHasShowcase?: boolean
}

export default function NFTTemplate({ collectible }: NFTTemplateProps) {
  const auth = useAuth()
  const userAddress = auth.user?.address
  const locale = useLocale()
  const { t } = useTranslation()

  const transferrableStatus = getTransferrableStatus(collectible, userAddress)
  const isTransferrable = [
    TransferrableStatus.CanTransfer,
    TransferrableStatus.IsListed,
  ].includes(transferrableStatus)
  const isListed = collectible.listingStatus === CollectibleListingStatus.Active
  const transferMessage = {
    frozen: t('nft:labels.cannotTransfer.frozen'),
    transactedRecently: t('nft:labels.cannotTransfer.transactedRecently', {
      date: new Date(collectible.transferrableAt).toLocaleString(),
    }),
  }[transferrableStatus]

  const purchasableStatus = getPurchasableStatus(collectible, userAddress)
  const isPurchasable = purchasableStatus === PurchasableStatus.CanPurchase

  const algoExplorerAddress = `${AppConfig.algoExplorerBaseURL}/asset/${collectible.address}`

  const assetId = String(collectible.address)

  const iconMap = {
    mint: SparklesIcon,
    list: TagIcon,
    purchase: ShoppingCartIcon,
    transfer: SwitchHorizontalIcon,
  }

  const renderType = ({ value }) => {
    const Icon = iconMap[value]
    return (
      <>
        <Icon className={css.icon} />
        <span>{t(`nft:activity.events.${value}`)}</span>
      </>
    )
  }
  const renderPrice = ({ value }) =>
    value ? formatCurrency(value, locale) : null
  const renderDate = ({ value }) =>
    value ? new Date(value).toLocaleString() : null
  const renderUserOrAddress = ({ value }) => {
    if (value?.username) return <UserLink username={value.username} />
    if (value?.address) return <AlgoAddress address={value.address} />
    return null
  }

  const { data: activity, isLoading: isLoadingActivity } =
    useNFTActivities(assetId)

  const TABLE_COLUMNS = [
    { name: t('nft:activity.table.Event'), key: 'type', renderer: renderType },
    {
      name: t('nft:activity.table.Price'),
      key: 'amount',
      renderer: renderPrice,
    },
    {
      name: t('nft:activity.table.From'),
      key: 'sender',
      renderer: renderUserOrAddress,
    },
    {
      name: t('nft:activity.table.To'),
      key: 'recipient',
      renderer: renderUserOrAddress,
    },
    { name: t('nft:activity.table.Date'), key: 'date', renderer: renderDate },
  ]

  return (
    <div className={css.root}>
      <div className={css.nftCard}>
        <div className={css.topSection}>
          <div className={css.container}>
            <H2 center uppercase mb={3}>
              {collectible.title}
            </H2>

            {transferMessage ? (
              <Alert content={transferMessage} centerContent />
            ) : null}

            <div className={css.mediaWrapper}>
              {collectible.previewVideo ? (
                <Video autoPlay controls src={collectible.previewVideo} />
              ) : (
                <MediaGallery media={[collectible.image]} />
              )}
              {isListed && (
                <div className={css.ribbon}>
                  {t('common:statuses.For Sale')}
                </div>
              )}
            </div>

            <div className={css.majorDetailsWrapper}>
              <span>
                <Trans
                  components={[<b key={0} />, <b key={1} />]}
                  i18nKey="nft:labels.editionXWrappers"
                  values={{
                    edition: collectible.edition,
                    totalEditions: collectible.totalEditions,
                  }}
                />
              </span>
              <span>
                <Trans
                  components={[<b key={0} />]}
                  i18nKey="nft:labels.mintedAt"
                  values={{
                    date: new Date(collectible.mintedAt).toLocaleDateString(
                      locale,
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    ),
                  }}
                />
              </span>
            </div>
          </div>
        </div>

        <div className={css.bottomSection}>
          <div className={css.ownership}>
            <p className={css.ownedByLabel}>{t('nft:labels.ownedBy')}</p>
            <Avatar
              username={collectible.currentOwner}
              className={css.currentOwner}
            />
            {isTransferrable && (
              <LinkButton
                href={urlFor(urls.nftSell, { assetId })}
                className={css.sellButton}
              >
                {isListed ? t('nft:sell.removeListing') : t('nft:sell.title')}
              </LinkButton>
            )}
            {isPurchasable && (
              <LinkButton
                href={urlFor(urls.checkoutCollectible, { assetId })}
                className={css.purchaseButton}
              >
                {t('nft:purchase.title')}
              </LinkButton>
            )}
          </div>
          <div className={css.container}>
            <section className={css.nftSection}>
              <H2 mb={5} uppercase>
                {t('nft:details.title')}
              </H2>
              {collectible.subtitle ? (
                <H3 mb={3}>{collectible.subtitle}</H3>
              ) : null}
              {collectible.body ? (
                <p className={css.body}>{collectible.body}</p>
              ) : null}

              <ul className={css.nftMetaList}>
                <CollectibleMetaListItem
                  label={t('nft:labels.Owner')}
                  value={
                    <UserLink username={collectible.currentOwner} underline />
                  }
                />
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
                <CollectibleMetaListItem label={t('nft:labels.Rarity')}>
                  <Pill small>{collectible?.rarity?.name}</Pill>
                </CollectibleMetaListItem>
                <CollectibleMetaListItem label={t('nft:labels.Address')}>
                  <ExternalLink
                    className={css.underlineLink}
                    href={algoExplorerAddress}
                  >
                    {algoExplorerAddress}
                  </ExternalLink>
                </CollectibleMetaListItem>
                <CollectibleMetaListItem
                  label={t('nft:labels.uniqueId')}
                  value={collectible?.uniqueCode}
                />
              </ul>
            </section>

            <section className={css.nftSection}>
              <H2 className="mb-5" uppercase>
                {t('nft:activity.title')}
              </H2>
              <Async isLoading={isLoadingActivity} preventScroll>
                <Table<CollectibleActivity>
                  className={css.nftActivityList}
                  noOuterBorder
                  columns={TABLE_COLUMNS}
                  data={activity}
                />
              </Async>
            </section>

            {/* TODO: We don't have designs for this yet. */}
            {AppConfig.isTransfersEnabled ? (
              <section className={css.nftSection}>
                <H2 className="mb-5" uppercase>
                  {t('nft:transfer.title')}
                </H2>
                <p className="mb-4">{t('nft:transfer.body')}</p>
                <p className="mb-4">
                  {/* TODO update href */}
                  <AppLink href="/">{t('nft:transfer.learnMore')}</AppLink>
                </p>
                <LinkButton
                  href={urlFor(urls.nftInitiateTransfer, { assetId })}
                >
                  {t(`nft:transfer.transferMyNFT`)}
                </LinkButton>
              </section>
            ) : null}
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
      <div className={clsx(css.nftMetaListCol, css.nftMetaLabel)}>{label}</div>
      <div className={css.nftMetaListCol}>
        <span>{children ?? value}</span>
      </div>
    </li>
  ) : null
