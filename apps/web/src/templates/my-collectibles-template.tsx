import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './my-collectibles-template.module.css'

import CollectibleBrowserDialog from '@/components/collectibles/collectible-browser-dialog'
import CollectibleItem from '@/components/collectibles/collectible-item'
import NoCollectiblesContent from '@/components/collectibles/no-collectibles-content'
import Grid from '@/components/grid/grid'
import Pagination, { PAGE_SIZE } from '@/components/pagination/pagination'
import Select, { SelectOption } from '@/components/select/select'
import Tabs from '@/components/tabs/tabs'
import { useAuth } from '@/contexts/auth-context'
import {
  collectibleIsNumberOfDaysOld,
  getCollectionTabs,
} from '@/utils/collections'

export interface MyCollectiblesTemplateProps {
  activeAsset: CollectibleWithDetails | null
  assets: CollectibleWithDetails[]
  currentPage: number
  handleRedirectBrands: () => void
  handlePageChange: (pageNumber: number) => void
  handleSortChange: (option: SelectOption) => void
  isViewerActive: boolean
  selectedOption: SelectOption
  selectOptions: SelectOption[]
  toggleViewer: (asset?: CollectibleWithDetails | undefined) => void
  totalCollectibles: number
}

export default function MyCollectiblesTemplate({
  activeAsset,
  assets,
  currentPage,
  handleRedirectBrands,
  handlePageChange,
  handleSortChange,
  isViewerActive,
  selectedOption,
  selectOptions,
  toggleViewer,
  totalCollectibles,
}: MyCollectiblesTemplateProps) {
  const { t } = useTranslation()
  const auth = useAuth()

  return (
    <>
      {/* Viewer */}
      <CollectibleBrowserDialog
        open={isViewerActive}
        onClose={() => toggleViewer()}
        username={auth.user?.username || ''}
        isCurrentUser
        initialCollectible={
          activeAsset
            ? assets.findIndex(({ id }) => id === activeAsset.id)
            : undefined
        }
        collectibles={assets}
      />

      {/* Tabs */}
      <Tabs activeTab={0} tabs={getCollectionTabs(t)} />

      {/* Collectibles */}
      {assets.length > 0 ? (
        <>
          {/* Sorting filter */}
          <div className={css.selectWrapper}>
            <Select
              handleChange={handleSortChange}
              id="sortOption"
              options={selectOptions}
              selectedValue={selectedOption}
            />
          </div>
          <Grid>
            {assets.map((asset) => (
              <CollectibleItem
                alt={asset.title}
                imageUrl={asset.image}
                isNew={
                  asset.claimedAt
                    ? collectibleIsNumberOfDaysOld(asset.claimedAt)
                    : undefined
                }
                key={asset.id}
                onClick={() => toggleViewer(asset)}
                title={asset.title}
              />
            ))}
          </Grid>

          <div className={css.paginationWrapper}>
            <Pagination
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              setPage={handlePageChange}
              total={totalCollectibles}
            />
          </div>
        </>
      ) : (
        <NoCollectiblesContent handleRedirect={handleRedirectBrands} />
      )}
    </>
  )
}
