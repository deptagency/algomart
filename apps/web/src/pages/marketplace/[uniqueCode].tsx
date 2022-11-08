import { CollectibleBase, CollectibleListingType } from '@algomart/schemas'
import { GetStaticProps, GetStaticPropsContext } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import { ApiClient } from '@/clients/api-client'
import { PAGE_SIZE } from '@/components/pagination/pagination'
import { AppConfig } from '@/config'
import { useLanguage } from '@/contexts/language-context'
import { useNFTs } from '@/hooks/api/use-nfts'
import DefaultLayout from '@/layouts/default-layout'
import BrowseCollectibleTemplate from '@/templates/browse-collectible-template'

export interface BrowseCollectiblePageProps {
  collectibleTemplate: CollectibleBase
}

export default function BrowseCollectiblePage({
  collectibleTemplate,
}: BrowseCollectiblePageProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const { language } = useLanguage()

  const { data } = useNFTs({
    language,
    listingType: [
      CollectibleListingType.Auction,
      CollectibleListingType.FixedPrice,
    ],
    joinListings: true,
    joinCurrentOwner: true,
    page,
    pageSize: PAGE_SIZE,
    templateIds: [collectibleTemplate.templateId],
  })

  return (
    data?.collectibles && (
      <DefaultLayout
        fullBleed
        pageTitle={t('common:pageTitles.Collectible Template', {
          name: collectibleTemplate.title,
        })}
      >
        <BrowseCollectibleTemplate
          collectibleTemplate={collectibleTemplate}
          collectibles={data.collectibles}
          page={page}
          onPageChange={setPage}
          total={data.total}
        />
      </DefaultLayout>
    )
  )
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
  const client = new ApiClient(AppConfig.apiURL)
  const collectibleTemplate = await client.getCollectibleTemplateByUniqueCode({
    uniqueCode: context?.params?.uniqueCode as string,
    language: context.locale,
  })

  return {
    props: { collectibleTemplate },
    revalidate: 10,
  }
}
