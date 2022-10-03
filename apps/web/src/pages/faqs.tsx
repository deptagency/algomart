import { DEFAULT_LANG, Faq, Faqs } from '@algomart/schemas'
import { GetStaticPropsContext } from 'next'
import useTranslation from 'next-translate/useTranslation'

import DefaultLayout from '@/layouts/default-layout'
import FaqTemplate from '@/templates/faq-template'
import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

interface FaqProps {
  data: Faqs
}

export default function FaqPage({ data: { faqs } }: FaqProps) {
  const { t } = useTranslation()

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.FAQS')} noPanel>
      <FaqTemplate faqs={faqs} />
    </DefaultLayout>
  )
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const data = await apiFetcher()
    .get<Faq>(urls.api.faqs, {
      bearerToken: null,
      searchParams: {
        language: context.locale || DEFAULT_LANG,
      },
    })
    .catch(() => null)

  return {
    props: {
      data: {
        faqs: data?.faqs || [],
      },
    },
    revalidate: 60,
  }
}
