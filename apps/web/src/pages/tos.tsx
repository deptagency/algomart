import { DEFAULT_LOCALE } from '@algomart/schemas'
import { GetStaticPropsContext } from 'next'

import { ApiClient } from '@/clients/api-client'
import DefaultLayout from '@/layouts/default-layout'

/**
 * This could probably be changed to a generic 'page' component where the page title is passed as a prop, but
 * next.js doesn't allow SSR on components
 */

//TODO: Add css to this page
interface TosProps {
  page: {
    title: string
    body: string
  }
}

export default function TosPage({ page }: TosProps) {
  return (
    <DefaultLayout pageTitle={page.title}>
      <div className="p-3">
        <div>{page.title} </div>
        <div dangerouslySetInnerHTML={{ __html: page.body }} />
      </div>
    </DefaultLayout>
  )
}

export async function getStaticProps(context: GetStaticPropsContext) {
  try {
    const page = await ApiClient.instance.getDirectusPage(
      'tos',
      context.locale || DEFAULT_LOCALE
    )
    return {
      props: {
        page,
      },
    }
  } catch {
    return { notFound: true }
  }
}
