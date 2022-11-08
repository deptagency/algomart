import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import BrowseCollectibleItem from '@/components/browse-products/browse-collectible-item'
import { useLanguage } from '@/contexts/language-context'
import { useNFTListings } from '@/hooks/api/use-nft-listings'
import { useCollectibleListingsFilter } from '@/hooks/use-collectible-listings-filter'
import { useSecondaryMarketplaceFlag } from '@/hooks/use-secondary-marketplace-flag'
import DefaultLayout from '@/layouts/default-layout'
import BrowseProductsTemplate, {
  BrowseProductsPageTitles,
} from '@/templates/browse-products-template'
import { getCollectiblesListingQueryFromState } from '@/utils/filters'
import { urls } from '@/utils/urls'

export default function BrowseCollectibleListings() {
  const { t } = useTranslation()
  const router = useRouter()
  const filter = useCollectibleListingsFilter()
  const { language } = useLanguage()
  const secondaryMarketplaceEnabled = useSecondaryMarketplaceFlag()

  const { data, isLoading } = useNFTListings(
    getCollectiblesListingQueryFromState(language, filter)
  )

  useEffect(() => {
    if (!secondaryMarketplaceEnabled) {
      router.replace(urls.drops)
    }
  }, [secondaryMarketplaceEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const products = data?.collectibleListings.map((collectibleListing) => (
    <BrowseCollectibleItem
      key={collectibleListing.uniqueCode}
      collectibleListing={collectibleListing}
    />
  ))

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Marketplace')}
      noPanel
      variant="colorful"
    >
      {secondaryMarketplaceEnabled && (
        <BrowseProductsTemplate
          isLoading={isLoading}
          pageTitle={BrowseProductsPageTitles.MARKETPLACE}
          products={products || []}
          total={data?.total || 0}
          showFilterType={false}
        />
      )}
    </DefaultLayout>
  )
}
