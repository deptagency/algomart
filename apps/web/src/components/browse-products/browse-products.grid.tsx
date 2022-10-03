import useTranslation from 'next-translate/useTranslation'
import React, { ReactNode } from 'react'

import BrowseProductsFilterPrice from './browse-products-filter-price'
import BrowseProductsFilterTags from './browse-products-filter-tags'
import BrowseProductsFilterType from './browse-products-filter-type'
import BrowseProductsFiltersMobile from './browse-products-filters-mobile'

import css from '@/components/browse-products/browse-products-grid.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Async from '@/components/async/async'
import Pagination from '@/components/pagination/pagination'
import { usePackFilter } from '@/hooks/use-pack-filter'

export interface BrowseProductsGridProps {
  isLoading: boolean
  products: ReactNode[]
  total: number
  showFilterType?: boolean
}

export default function BrowseProductsGrid({
  products,
  isLoading,
  total,
  showFilterType,
}: BrowseProductsGridProps) {
  const { t } = useTranslation()
  const filter = usePackFilter()

  return (
    <div className={css.columns}>
      <BrowseProductsFiltersMobile showFilterTypes={showFilterType} />
      <section className={css.filterColumn}>
        <BrowseProductsFilterTags />
        <BrowseProductsFilterPrice />
        {showFilterType && <BrowseProductsFilterType />}
      </section>

      {/* Products */}
      <section className={css.resultsColumn}>
        <Async isLoading={isLoading}>
          {products.length === 0 && !isLoading ? (
            <AlertMessage
              content={t('drops:filters.noProducts')}
              variant="red"
            />
          ) : (
            <>
              <div className={css.packColumns}>{products}</div>
              <div className={css.paginationWrapper}>
                <Pagination
                  currentPage={filter.currentPage}
                  pageSize={filter.pageSize}
                  setPage={(page) => filter.updateState({ currentPage: page })}
                  total={total}
                />
              </div>
            </>
          )}
        </Async>
      </section>
    </div>
  )
}
