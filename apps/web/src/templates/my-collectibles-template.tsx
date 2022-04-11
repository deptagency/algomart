import { CollectibleWithDetails } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'

import css from './my-collectibles-template.module.css'

import CollectibleItem from '@/components/collectibles/collectible-item'
import NoCollectiblesContent from '@/components/collectibles/no-collectibles-content'
import Grid from '@/components/grid/grid'
import Pagination, { PAGE_SIZE } from '@/components/pagination/pagination'
import Select, { SelectOption } from '@/components/select/select'
import Tabs from '@/components/tabs/tabs'
import {
  collectibleIsNumberOfDaysOld,
  getCollectionTabs,
} from '@/utils/collections'
import { urls } from '@/utils/urls'

export interface MyCollectiblesTemplateProps {
  assets: CollectibleWithDetails[]
  currentPage: number
  onRedirectBrands: () => void
  onPageChange: (pageNumber: number) => void
  onSortChange: (option: string) => void
  sortMode: string
  sortOptions: SelectOption[]
  totalCollectibles: number
}

export default function MyCollectiblesTemplate({
  assets,
  currentPage,
  onRedirectBrands,
  onPageChange,
  onSortChange,
  sortMode,
  sortOptions,
  totalCollectibles,
}: MyCollectiblesTemplateProps) {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <>
      {/* Tabs */}
      <Tabs activeTab={0} tabs={getCollectionTabs(t)} className="-mx-8 -mt-8" />

      {/* Collectibles */}
      {assets.length > 0 ? (
        <>
          {/* Sorting filter */}
          <div className={css.selectWrapper}>
            <Select
              id="sortOption"
              options={sortOptions}
              value={sortMode}
              onChange={onSortChange}
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
                onClick={() => {
                  router.push(
                    urls.nft.replace(':assetId', String(asset.address))
                  )
                }}
                title={asset.title}
              />
            ))}
          </Grid>

          <div className={css.paginationWrapper}>
            <Pagination
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              setPage={onPageChange}
              total={totalCollectibles}
            />
          </div>
        </>
      ) : (
        <NoCollectiblesContent onRedirect={onRedirectBrands} />
      )}
    </>
  )
}
