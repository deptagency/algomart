import { Product } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './releases-template.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import AppLink from '@/components/app-link/app-link'
import Grid from '@/components/grid/grid'
import Loading from '@/components/loading/loading'
import Pagination from '@/components/pagination/pagination'
import ReleaseFilterPrice from '@/components/releases/release-filter-price'
import ReleaseFilterType from '@/components/releases/release-filter-type'
import ReleaseFiltersMobile from '@/components/releases/release-filters-mobile'
import ProductItem from '@/components/releases/release-item'
import Select from '@/components/select/select'
import { useProductFilterContext } from '@/contexts/product-filter-context'
import { productFilterActions } from '@/hooks/use-product-filter'
import { PRODUCTS_PER_PAGE } from '@/pages/browse'
import { urls } from '@/utils/urls'

export interface ProductsTemplateProps {
  isLoading: boolean
  products: Product[]
  total: number
}

export default function ProductsTemplate({
  isLoading,
  products,
  total,
}: ProductsTemplateProps) {
  const { dispatch, state } = useProductFilterContext()
  const { t } = useTranslation()

  return (
    <div className={css.root}>
      {/* Sorting */}
      <div className={css.selectWrapper}>
        <Select
          className={css.select}
          onChange={(value) => dispatch(productFilterActions.setSort(value))}
          id="sortOption"
          options={state.selectOptions}
          value={state.sortMode}
        />
      </div>
      <div className={clsx(css.columns)}>
        {/* Filters */}
        <ReleaseFiltersMobile />
        <section className={css.filterColumn}>
          <ReleaseFilterPrice />
          <ReleaseFilterType />
        </section>

        {/* Release Packs */}
        {isLoading ? (
          <div className={css.loadingWrapper}>
            <Loading />
          </div>
        ) : products.length === 0 ? (
          <div className={css.notificationWrapper}>
            <AlertMessage
              className={css.notification}
              content={t('release:filters.noReleases')}
              variant="red"
            />
          </div>
        ) : (
          <section className={css.gridColumn}>
            <>
              <Grid columns={3}>
                {products.map((product) => (
                  <AppLink
                    className={css.gridItem}
                    key={product.packSlug || product.collectibleTemplateId}
                    href={
                      product.packSlug
                        ? urls.pack.replace(':packSlug', product.packSlug)
                        : urls.nft.replace(':assetId', product.collectibleId)
                    }
                  >
                    <ProductItem product={product} />
                  </AppLink>
                ))}
              </Grid>
              <div className={css.paginationWrapper}>
                <Pagination
                  currentPage={state.currentPage}
                  pageSize={PRODUCTS_PER_PAGE}
                  setPage={(page) =>
                    dispatch(productFilterActions.setCurrentPage(page))
                  }
                  total={total}
                />
              </div>
            </>
          </section>
        )}
      </div>
    </div>
  )
}
