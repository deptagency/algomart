import { DEFAULT_LOCALE } from '@algomart/schemas'
import { GetServerSidePropsContext } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { ApiClient } from '@/clients/api-client'
import Heading from '@/components/heading'
import DefaultLayout from '@/layouts/default-layout'

interface FaqProps {
  data: {
    faqs: {
      question: string
      answer: string
    }[]
  }
}

export default function FaqPage({ data: { faqs } }: FaqProps) {
  const { t } = useTranslation()
  return (
    <DefaultLayout pageTitle={t('common:pageTitles.FAQS')}>
      <Heading className="px-4 mb-4 text-center">
        {t('common:pageTitles.FAQS')}
      </Heading>
      {faqs.map((faq, index) => (
        <div key={`faq-${index}`}>
          <div className="px-4 py-4">{faq.question}</div>
          <div className="px-4">{faq.answer}</div>
        </div>
      ))}
    </DefaultLayout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {
      data: await ApiClient.instance.getFaqs(context.locale || DEFAULT_LOCALE),
    },
  }
}
