import {
  CollectibleBase,
  CollectibleListingType,
  CollectibleWithDetails,
} from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './browse-collectible-template.module.css'

import AppLink from '@/components/app-link/app-link'
import Credits from '@/components/currency/credits'
import { H1, H2 } from '@/components/heading'
import LinkButton from '@/components/link-button'
import MediaGallery from '@/components/media-gallery/media-gallery'
import Pagination, { PAGE_SIZE } from '@/components/pagination/pagination'
import Panel from '@/components/panel'
import Table, { ColumnDefinitionType } from '@/components/table'
import UserLink from '@/components/user-link/user-link'
import Video from '@/components/video'
import { useAuth } from '@/contexts/auth-context'
import { urlFor, urls } from '@/utils/urls'

export interface BrowseCollectibleTemplateProps {
  collectibleTemplate: CollectibleBase
  collectibles: CollectibleWithDetails[]
  onPageChange(page: number): void
  page: number
  total: number
}

export default function BrowseCollectibleTemplate({
  collectibleTemplate,
  collectibles,
  onPageChange,
  page,
  total,
}: BrowseCollectibleTemplateProps) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const TABLE_COLUMNS: ColumnDefinitionType<CollectibleWithDetails>[] = [
    {
      key: 'edition',
      name: t('nft:labels.Edition'),
      renderer: ({ item }: { item: CollectibleWithDetails }) => (
        <AppLink href={urlFor(urls.nftDetails, { assetId: item.address })}>
          {t('nft:labels.editionX', {
            edition: item.edition,
            totalEditions: item.totalEditions,
          })}
        </AppLink>
      ),
    },
    {
      key: 'price',
      name: t('nft:labels.Price'),
      renderer: ({ value }) => <Credits value={value as number} />,
    },
    {
      key: 'currentOwner',
      name: t('nft:labels.Owner'),
      renderer: ({ value }) => <UserLink username={value as string} />,
    },
    {
      key: '',
      name: '',
      renderer: ({ item }: { item: CollectibleWithDetails }) => (
        <LinkButton
          href={urlFor(urls.checkoutCollectible, {
            assetId: String(item.address),
          })}
          className={css.ctaButton}
          disabled={item.currentOwnerAddress === user?.address}
          data-e2e="collectible-action-buy"
        >
          {item.listingType === CollectibleListingType.FixedPrice
            ? t('common:actions.Buy Now')
            : t('common:actions.Place Bid')}
        </LinkButton>
      ),
    },
  ]

  return (
    <>
      <section className={css.section}>
        <div className={css.container}>
          <div className={css.collectibleMedia}>
            {collectibleTemplate.previewVideo ? (
              <Video
                autoPlay
                controls
                loop
                src={collectibleTemplate.previewVideo}
              />
            ) : (
              <MediaGallery media={[collectibleTemplate.image]} />
            )}
          </div>
        </div>
      </section>

      <section className={css.section}>
        <div className={css.container}>
          <div className={css.collectibleDetails}>
            <H1 uppercase>{collectibleTemplate.title}</H1>
            <H2 size={4} mt={2}>
              {collectibleTemplate.subtitle ? (
                <p className={css.subtitle}>{collectibleTemplate.subtitle}</p>
              ) : null}
            </H2>
          </div>
        </div>
      </section>

      <section className={css.section}>
        <div className={css.container}>
          <div className={css.nftMetaContent}>
            <Panel
              title={t('drops:collectibles.listings')}
              className="my-10"
              fullWidth
              hScrollContent
            >
              <Table
                noOuterBorder
                className={css.table}
                columns={TABLE_COLUMNS}
                data={collectibles}
              />

              {total > PAGE_SIZE && (
                <div className={css.paginationWrapper}>
                  <Pagination
                    currentPage={page}
                    pageSize={PAGE_SIZE}
                    setPage={onPageChange}
                    total={total}
                  />
                </div>
              )}
            </Panel>
          </div>
        </div>
      </section>
    </>
  )
}
