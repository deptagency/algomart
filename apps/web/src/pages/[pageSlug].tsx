import { DEFAULT_LOCALE } from '@algomart/schemas'
import { GetStaticPropsContext } from 'next'

import { ApiClient } from '@/clients/api-client'
import Page, { PageProps } from '@/components/page/page'
import { AppConfig } from '@/config'

//TODO: Add css to this page
export default function DirectusPage(props: PageProps) {
  return <Page {...props} />
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export async function getStaticProps(context: GetStaticPropsContext) {
  try {
    const slug = context?.params?.pageSlug
    if (typeof slug !== 'string') return { notFound: true }

    const client = new ApiClient(AppConfig.apiURL)
    const page = await client.getDirectusPage(
      slug,
      context.locale || DEFAULT_LOCALE
    )

    return { props: page, revalidate: 60 }
  } catch {
    return { notFound: true, revalidate: 1 }
  }
}
