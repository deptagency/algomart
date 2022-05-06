import { SetBase } from '@algomart/schemas'
import Trans from 'next-translate/Trans'

import css from './collection-header.module.css'

import AppLink from '@/components/app-link/app-link'
import Heading from '@/components/heading'
import { urlFor, urls } from '@/utils/urls'

export interface SetHeaderProps {
  set: SetBase
  collectionSlug: string
  collectionName: string
}

export default function SetHeader({
  set,
  collectionSlug,
  collectionName,
}: SetHeaderProps) {
  const myCollectionUrl = urlFor(urls.myCollection, { collectionSlug })
  return (
    <div className={css.root}>
      <Heading className={css.heading}>{set.name}</Heading>
      <Trans
        components={[
          <p className={css.subHeading} key={0} />,
          <AppLink key={1} href={myCollectionUrl} />,
        ]}
        i18nKey="collection:collectionPage.Part of Collection"
        values={{ name: collectionName }}
      />
    </div>
  )
}
