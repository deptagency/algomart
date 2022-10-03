import { SortOptions } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import React, { ReactNode } from 'react'

import css from './browse-products-template.module.css'
import common from './common-template-styles.module.css'

import BrowseProductsGrid from '@/components/browse-products/browse-products.grid'
import { H1 } from '@/components/heading'
import Select from '@/components/select'
import { usePackFilter } from '@/hooks/use-pack-filter'

export enum BrowseProductsPageTitles {
  MARKETPLACE = 'Marketplace',
  DROPS = 'Drops',
}

export interface BrowseProductsTemplateProps {
  isLoading: boolean
  pageTitle?: BrowseProductsPageTitles
  products?: ReactNode[]
  total?: number
  showFilterType?: boolean
}

export default function BrowseProductsTemplate({
  isLoading,
  pageTitle,
  products,
  total,
  showFilterType,
}: BrowseProductsTemplateProps) {
  const { t } = useTranslation()
  const filter = usePackFilter()

  return (
    <div>
      <div className={css.header}>
        <H1 inheritColor className={common.pageHeading}>
          {pageTitle && t(`common:pageTitles.${pageTitle}`)}
        </H1>
        {/* Sorting */}
        <Select
          onChange={(value: SortOptions) =>
            filter.updateState({ sortMode: value })
          }
          id="sortOption"
          options={filter.selectOptions}
          density="compact"
          value={filter.sortMode}
          variant="solid"
        />
      </div>

      <BrowseProductsGrid
        isLoading={isLoading}
        products={products}
        total={total}
        showFilterType={showFilterType}
      />
    </div>
  )
}
