import useTranslation from 'next-translate/useTranslation'

import BrowsePackItem from '@/components/browse-products/browse-pack-item'
import { AppConfig } from '@/config'
import { usePublishedPacks } from '@/hooks/api/use-published-packs'
import { usePackFilter } from '@/hooks/use-pack-filter'
import DefaultLayout from '@/layouts/default-layout'
import BrowseProductsTemplate, {
  BrowseProductsPageTitles,
} from '@/templates/browse-products-template'

export default function BrowsePackReleases() {
  const { t } = useTranslation()
  const filter = usePackFilter()
  const { data, isLoading } = usePublishedPacks(filter.apiQueryString)

  const products = data?.packs.map((pack) => (
    <BrowsePackItem pack={pack} key={pack.templateId} />
  ))

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Drops')}
      noPanel
      variant="colorful"
    >
      <BrowseProductsTemplate
        isLoading={isLoading}
        pageTitle={BrowseProductsPageTitles.DROPS}
        products={products || []}
        total={data?.total || 0}
        showFilterType={AppConfig.isBiddingEnabled}
      />
    </DefaultLayout>
  )
}
