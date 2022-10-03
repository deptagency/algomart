import { PublishedPack } from '@algomart/schemas'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './upcoming-pack-card.module.css'

import AppLink from '@/components/app-link/app-link'
import { H3 } from '@/components/heading'
import { useLanguage } from '@/contexts/language-context'
import { urlFor, urls } from '@/utils/urls'

export function UpcomingPackCard({ pack }: { pack: PublishedPack }) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  return (
    <AppLink
      href={urlFor(urls.releasePack, { packSlug: pack.slug })}
      className={css.upcomingPackCard}
    >
      <div className="mb-[10px] relative aspect-1">
        <Image loading="lazy" src={pack.image} alt={pack.title} layout="fill" />
      </div>
      <div>
        <H3 inheritColor className="mb-1 text-center uppercase">
          {pack.title}
        </H3>
        <p className="text-sm text-center">
          {t('release:Drops')}{' '}
          {new Date(pack.releasedAt).toLocaleString(language, {
            dateStyle: 'long',
          })}
        </p>
      </div>
    </AppLink>
  )
}
