import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './algo-address-template.module.css'

import CollectibleBrowserDialog from '@/components/collectibles/collectible-browser-dialog'
import CollectibleItem from '@/components/collectibles/collectible-item'
import ExternalLink from '@/components/external-link'
import Grid from '@/components/grid/grid'
import Heading from '@/components/heading'
import Pagination, { PAGE_SIZE } from '@/components/pagination/pagination'
import Select, { SelectOption } from '@/components/select-input/select-input'
import { useAuth } from '@/contexts/auth-context'
import { formatAlgoAddress } from '@/utils/format-string'

export interface AlgoAddressTemplateProps {
  activeAsset: CollectibleWithDetails | null
  algoAddress: string
  algoAddressIsInvalid: boolean
  assets: CollectibleWithDetails[]
  currentPage: number
  handlePageChange: (pageNumber: number) => void
  onSortChange: (value: string) => void
  isViewerActive: boolean
  sortMode: string
  sortOptions: SelectOption[]
  toggleViewer: (asset?: CollectibleWithDetails | undefined) => void
  totalCollectibles: number
}

export default function AlgoAddressTemplate({
  activeAsset,
  algoAddress,
  algoAddressIsInvalid,
  assets,
  currentPage,
  handlePageChange,
  onSortChange,
  isViewerActive,
  sortMode,
  sortOptions,
  toggleViewer,
  totalCollectibles,
}: AlgoAddressTemplateProps) {
  const { user } = useAuth()
  const { t } = useTranslation()

  const formattedAlgoAddress = formatAlgoAddress(algoAddress)
  const isCurrentUser = user?.address === algoAddress

  const Address = () => (
    <>
      <span className={css.isDesktop}>{algoAddress}</span>
      <span className={css.isMobile}>{formattedAlgoAddress}</span>
    </>
  )

  const Title = () => {
    return (
      <Heading className={css.pageTitle} level={1}>
        {t('collection:algoAddressPage.Algorand Account')}:
        <div>
          {algoAddressIsInvalid ? (
            <Address />
          ) : (
            <ExternalLink
              href={`https://algoexplorer.io/address/${algoAddress}`}
              target="_blank"
              title={algoAddress}
            >
              <Address />
            </ExternalLink>
          )}
        </div>
      </Heading>
    )
  }

  if (algoAddressIsInvalid) {
    return (
      <>
        <Title />
        <p className={css.emptyState}>
          {t('collection:algoAddressPage.invalidAlgoAccount')}
        </p>
      </>
    )
  }

  if (assets.length === 0) {
    return (
      <>
        <Title />
        <p className={css.emptyState}>
          {t('collection:algoAddressPage.noCollectiblesInAccount')}
        </p>
      </>
    )
  }

  return (
    <>
      <Title />

      {/* Viewer */}
      <CollectibleBrowserDialog
        collectibles={assets}
        isCurrentUser={isCurrentUser}
        initialCollectible={
          activeAsset
            ? assets.findIndex(({ id }) => id === activeAsset.id)
            : undefined
        }
        isAlgoAddress={!isCurrentUser}
        onClose={() => toggleViewer()}
        open={isViewerActive}
        username={
          isCurrentUser ? (user?.username as string) : formattedAlgoAddress
        }
      />

      {/* Sorting filter */}
      <div className={css.selectWrapper}>
        <Select
          onChange={onSortChange}
          id="sortOption"
          options={sortOptions}
          value={sortMode}
        />
      </div>

      {/* Collectibles */}
      <Grid>
        {assets.map((asset) => (
          <CollectibleItem
            alt={asset.title}
            imageUrl={asset.image}
            key={asset.id}
            onClick={() => toggleViewer(asset)}
            title={asset.title}
          />
        ))}
      </Grid>

      {/* Pagination */}
      <div className={css.paginationWrapper}>
        <Pagination
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          setPage={handlePageChange}
          total={totalCollectibles}
        />
      </div>
    </>
  )
}
