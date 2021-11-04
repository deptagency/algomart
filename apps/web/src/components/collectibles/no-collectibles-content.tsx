import useTranslation from 'next-translate/useTranslation'

import css from './no-collectibles-content.module.css'

import Button from '@/components/button'
import CollectiblePlaceholder from '@/components/collectibles/collectible-placeholder'
import Heading from '@/components/heading'

export interface NoCollectiblesContentProps {
  handleRedirect(): void
}

export default function NoCollectiblesContent({
  handleRedirect,
}: NoCollectiblesContentProps) {
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

      <Heading className={css.heading} level={3}>
        {t('collection:viewer.startCollection')}
      </Heading>

      <Button onClick={handleRedirect}>
        {t('collection:viewer.Find Something Cool')}
      </Button>
    </div>
  )
}
