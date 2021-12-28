import useTranslation from 'next-translate/useTranslation'

// import css from './no-collectibles-content.module.css'

import Button from '@/components/button'
// import CollectiblePlaceholder from '@/components/collectibles/collectible-placeholder'
import Heading from '@/components/heading'

export interface NoCollectiblesContentProps {
  handleRedirect(): void
}

export default function NoCollectiblesContent({
  handleRedirect,
}: NoCollectiblesContentProps) {
  const { t } = useTranslation()
  return (
    <div className='flex flex-col items-center'>
      <Heading className='text-gray-200 text-3xl mb-8 font-bold my-12' level={3}>
        No collectibles
      </Heading>
      <Heading className='text-blue-800 font-bold my-12' level={3}>
        {t('collection:viewer.startCollection')}
      </Heading>
      <Button onClick={handleRedirect} className='mx-20 w-80 mb-12'>
        {t('collection:viewer.Find Something Cool')}
      </Button>
    </div>
  )
}
