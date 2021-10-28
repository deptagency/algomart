import { PublishedPack } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './releases-template.module.css'

import AppLink from '@/components/app-link/app-link'
import Grid from '@/components/grid/grid'
import Loading from '@/components/loading/loading'
import Notification from '@/components/notification/notification'
import Pagination from '@/components/pagination/pagination'
import ReleaseFilterPrice from '@/components/releases/release-filter-price'
import ReleaseFilterType from '@/components/releases/release-filter-type'
import ReleaseItem from '@/components/releases/release-item'
import Select from '@/components/select/select'
import { usePackFilterContext } from '@/contexts/pack-filter-context'
import { packFilterActions } from '@/hooks/usePackFilter'
import { RELEASES_PER_PAGE } from '@/pages/releases'
import { urls } from '@/utils/urls'

export interface ReleasesTemplateProps {
  isLoading: boolean
  packs: PublishedPack[]
  total: number
}

export default function ReleasesTemplate({
  isLoading,
  packs,
  total,
}: ReleasesTemplateProps) {
  const { dispatch, state } = usePackFilterContext()
  const { t } = useTranslation()

  return (
    <div className={css.root}>
      {/* Sorting */}
      <div className={css.selectWrapper}>
        <Select
          className={css.select}
          handleChange={(option) => dispatch(packFilterActions.setSort(option))}
          id="sortOption"
          options={state.selectOptions}
          selectedValue={state.selectedOption}
        />
      </div>
      <div className={clsx(css.columns)}>
        {/* Filters */}
        <section className={css.filterColumn}>
          <ReleaseFilterPrice />
          <ReleaseFilterType />
        </section>

        {/* Release Packs */}
        {isLoading ? (
          <div className={css.loadingWrapper}>
            <Loading />
          </div>
        ) : packs.length === 0 ? (
          <div className={css.notificationWrapper}>
            <Notification
              className={css.notification}
              content={t('release:filters.noReleases')}
              variant="red"
            />
          </div>
        ) : (
          <section className={css.gridColumn}>
            <>
              <Grid columns={3}>
                {packs.map((pack) => (
                  <AppLink
                    className={css.gridItem}
                    key={pack.templateId}
                    href={urls.release.replace(':packSlug', pack.slug)}
                  >
                    <ReleaseItem pack={pack} />
                  </AppLink>
                ))}
              </Grid>
              <div className={css.paginationWrapper}>
                <Pagination
                  currentPage={state.currentPage}
                  pageSize={RELEASES_PER_PAGE}
                  setPage={(page) =>
                    dispatch(packFilterActions.setCurrentPage(page))
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
