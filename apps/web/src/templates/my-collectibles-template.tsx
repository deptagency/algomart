import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import common from './common-template-styles.module.css'
import css from './my-collectibles-template.module.css'

import CollectibleItem from '@/components/collectibles/collectible-item'
import NoCollectiblesContent from '@/components/collectibles/no-collectibles-content'
import Grid from '@/components/grid/grid'
import { H1 } from '@/components/heading'
import Pagination, { PAGE_SIZE } from '@/components/pagination/pagination'
import Select, { SelectOption } from '@/components/select/select'
import Tabs from '@/components/tabs/tabs'
import { ReactComponent as ThreeByThree } from '@/svgs/3x3.svg'
import { ReactComponent as FourByFour } from '@/svgs/4x4.svg'
import {
  collectibleIsNumberOfDaysOld,
  getCollectionTabs,
} from '@/utils/collections'
import { urlFor, urls } from '@/utils/urls'

export interface MyCollectiblesTemplateProps {
  assets: CollectibleWithDetails[]
  currentPage: number
  onPageChange: (pageNumber: number) => void
  onSortChange: (option: string) => void
  sortMode: string
  sortOptions: SelectOption[]
  totalCollectibles: number
}

export default function MyCollectiblesTemplate({
  assets,
  currentPage,
  onPageChange,
  onSortChange,
  sortMode,
  sortOptions,
  totalCollectibles,
}: MyCollectiblesTemplateProps) {
  const { t } = useTranslation()

  const gridColumnOptions = [3, 4]
  const [gridColumns, setGridColumns] = useState(4)

  const gridColumnTabs = [
    {
      onClick: () => setGridColumns(3),
      component: <ThreeByThree width="22" />,
    },
    {
      onClick: () => setGridColumns(4),
      component: <FourByFour width="22" />,
    },
  ]

  return (
    <>
      <H1 className={common.pageHeading}>
        {t('common:pageTitles.My Collectibles')}
      </H1>

      <div className={css.collectiblesHeaderContainer}>
        <div className={css.gridColumnToggle}>
          <Tabs
            activeTab={gridColumnOptions.indexOf(gridColumns)}
            tabs={gridColumnTabs}
          />
        </div>
        <Tabs activeTab={0} className={css.tabs} tabs={getCollectionTabs(t)} />
        {/* Sorting filter */}
        <div className={css.selectWrapper}>
          <Select
            id="sortOption"
            onChange={onSortChange}
            options={sortOptions}
            density="compact"
            value={sortMode}
            variant="solid"
          />
        </div>
      </div>

      {/* Collectibles */}
      {assets.length > 0 ? (
        <>
          <section className={css.collectiblesGrid}>
            <Grid gapBase={3} base={2} sm={3} md={gridColumns}>
              {assets.map((asset) => (
                <CollectibleItem
                  collectible={asset}
                  isNew={
                    asset.claimedAt
                      ? collectibleIsNumberOfDaysOld(asset.claimedAt)
                      : undefined
                  }
                  key={asset.id}
                  listingStatus={asset.listingStatus}
                  href={urlFor(urls.nft, { assetId: asset.address })}
                />
              ))}
            </Grid>
          </section>

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
        <NoCollectiblesContent />
      )}
    </>
  )
}
