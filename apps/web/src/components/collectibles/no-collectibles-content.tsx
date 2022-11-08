import useTranslation from 'next-translate/useTranslation'

import css from './no-collectibles-content.module.css'

import CollectiblePlaceholder from '@/components/collectibles/collectible-placeholder'
import { H3 } from '@/components/heading'
import LinkButton from '@/components/link-button'
import { urls } from '@/utils/urls'

export default function NoCollectiblesContent() {
  const { t } = useTranslation()
  return (
    <div className={css.root}>
      <div className={css.gridContainer}>
        {Array.from({ length: 3 })
          .fill('x')
          .map((_, index) => (
            <CollectiblePlaceholder key={String(index)} />
          ))}
      </div>

      <H3 center my={8} uppercase>
        {t('collection:viewer.startCollection')}
      </H3>

      <LinkButton href={urls.drops}>
        {t('collection:viewer.Find Something Cool')}
      </LinkButton>
    </div>
  )
}
