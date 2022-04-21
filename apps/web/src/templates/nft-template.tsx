import { CollectibleWithDetails } from '@algomart/schemas'
import {
  ShoppingCartIcon,
  SparklesIcon,
  SwitchHorizontalIcon,
  TagIcon,
} from '@heroicons/react/outline'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'

import css from './nft-template.module.css'

import Alert from '@/components/alert/alert'
import AppLink from '@/components/app-link/app-link'
import ExternalLink from '@/components/external-link'
import Heading from '@/components/heading'
import LinkButton from '@/components/link-button'
import MediaGallery from '@/components/media-gallery/media-gallery'
import ReleaseDescription from '@/components/release-details/sections/release-description'
import Tabs from '@/components/tabs/tabs'
import { useConfig } from '@/hooks/use-config'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency } from '@/utils/currency'
import { isAfterNow } from '@/utils/date-time'
import { urlFor, urls } from '@/utils/urls'

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
  // if (collectible.isFrozen) return 'frozen'
  if (isAfterNow(new Date(collectible.transferrableAt))) return 'mintedRecently'
  return 'canTransfer'
}

export default function NFTTemplate({
  userAddress,
  collectible,
}: NFTTemplateProps) {
  const config = useConfig()
  const { t } = useTranslation()
  const router = useRouter()
  const transferrableStatus = getTransferrableStatus(collectible, userAddress)
  const isTransferrable = transferrableStatus === 'canTransfer'
  const transferMessage = {
    frozen: t('nft:labels.cannotTransfer.frozen'),
    mintedRecently: t('nft:labels.cannotTransfer.mintedRecently', {
      date: new Date(collectible.transferrableAt).toLocaleString(),
    }),
  }[transferrableStatus]

  const assetId = String(collectible.address)
  const tabs = ['details', 'activity', 'sell', 'transfer'].map((tab) => ({
    label: t(`nft:tabs.${tab}`),
    href: urlFor(urls.nft, { assetId }) + `/${tab}`,
  }))
  const subPath = router.asPath.split('/').pop()
  const tabIndex = tabs.findIndex(({ href }) => href.endsWith(subPath))

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
          <Heading>{collectible.title}</Heading>
          {collectible.subtitle ? (
            <p className={css.subtitle}>{collectible.subtitle}</p>
          ) : null}
        </div>

        {userAddress && isTransferrable ? (
          <Tabs
            activeTab={tabIndex}
            variant="fullWidth"
            tabs={tabs}
            scroll={false}
          />
        ) : (
          <div className="-mb-6" />
        )}

        {subPath === 'activity' ? (
          <section className={css.tabContent}>
            <Heading level={2} size={1}>
              {t('nft:activity.title')}
            </Heading>
            <hr />
            <ol className={css.activityList}>
              {FAKE_ACTIVITY.map((item) => (
                <ActivityItem key={item.id} {...item} />
              ))}
            </ol>
          </section>
        ) : null}

        {subPath === 'sell' ? (
          <section className={css.tabContent}>
            <Heading level={2} size={1}>
              {t('nft:sell.title')}
            </Heading>
            <hr />
            <div className={css.tabContentNarrow}>
              <p>{t('nft:sell.body')}</p>
              <p>
                <a href="#">{t('nft:sell.learnMore')}</a>
              </p>
              <LinkButton
                href={urlFor(urls.nftInitiateTransfer, { assetId })}
                fullWidth
              >
                {t(`nft:sell.sellMyNFT`)}
              </LinkButton>
            </div>
          </section>
        ) : null}

        {subPath === 'transfer' ? (
          <section className={css.tabContent}>
            <Heading level={2} size={1}>
              {t('nft:transfer.title')}
            </Heading>
            <hr />
            <div className={css.tabContentNarrow}>
              <p>{t('nft:transfer.body')}</p>
              <p>
                <a href="#">{t('nft:transfer.learnMore')}</a>
              </p>
              <LinkButton
                href={urlFor(urls.nftInitiateTransfer, { assetId })}
                fullWidth
              >
                {t(`nft:transfer.transferMyNFT`)}
              </LinkButton>
            </div>
          </section>
        ) : null}

        {subPath === 'details' ? (
          <section>
            {collectible.body ? (
              <ReleaseDescription
                description={collectible.body}
                className={css.releaseDesc}
              />
            ) : null}
            <div className={css.nftMeta}>
              <div className={css.nftMetaContent}>
                <ul role="list" className={css.nftMetaList}>
                  {collectible.currentOwner ? (
                    <CollectibleMetaListItem label={t('nft:labels.Owner')}>
                      <AppLink
                        href={urlFor(urls.profileShowcase, {
                          username: collectible.currentOwner,
                        })}
                      >
                        @{collectible.currentOwner}
                      </AppLink>
                    </CollectibleMetaListItem>
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
                      href={`${config.algoExplorerBaseUrl}/asset/${collectible.address}`}
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
          </section>
        ) : null}
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

interface IActivityItem {
  id: string
  type: 'mint' | 'list' | 'purchase' | 'transfer'
  date: string
  username?: string
  address?: string
  amount?: number
}

const ActivityItem = ({ type, date, amount, ...rest }: IActivityItem) => {
  const { t } = useTranslation()
  const locale = useLocale()
  const Icon = {
    mint: SparklesIcon,
    list: TagIcon,
    purchase: ShoppingCartIcon,
    transfer: SwitchHorizontalIcon,
  }[type]
  return (
    <li className={css.activityItem}>
      <div className={css.icon}>
        <Icon />
      </div>
      <div className={css.body}>
        <div className={css.activity}>{t(`nft:activities.${type}`, rest)}</div>
        <div className={css.date}>{new Date(date).toLocaleString()}</div>
      </div>
      {amount ? (
        <div className={css.contentRight}>{formatCurrency(amount, locale)}</div>
      ) : null}
    </li>
  )
}

const FAKE_ACTIVITY: IActivityItem[] = [
  { id: '1', type: 'transfer', date: '2020-04-04', address: 'O2YYG...R4EVU' },
  {
    id: '2',
    type: 'purchase',
    date: '2020-03-03',
    username: 'afaceinacloud',
    amount: 50_000,
  },
  { id: '3', type: 'list', date: '2020-02-02' },
  { id: '4', type: 'mint', date: '2020-01-01' },
]
