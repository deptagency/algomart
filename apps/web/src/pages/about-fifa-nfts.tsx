import { DEFAULT_LOCALE } from '@algomart/schemas'
import { GetStaticPropsContext } from 'next'

import { ApiClient } from '@/clients/api-client'
import Page, { PageProps } from '@/components/page/page'

//TODO: Add css to this page
export default function DirectusPage(props: PageProps) {
  return <Page {...props} />
}

export async function getStaticProps(context: GetStaticPropsContext) {
  try {
    const page = await ApiClient.instance.getDirectusPage(
      'about-fifa-nfts',
      context.locale || DEFAULT_LOCALE
    )
    return {
      props: page,
    }
  } catch {
    return { notFound: true }
  }
}
