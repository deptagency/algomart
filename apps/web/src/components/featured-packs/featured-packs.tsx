import { PublishedPack } from '@algomart/schemas'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './featured-packs.module.css'

import AppLink from '@/components/app-link/app-link'
import Grid from '@/components/grid/grid'
import { useLocale } from '@/hooks/use-locale'
import { isBeforeNow } from '@/utils/date-time'
import { urlFor, urls } from '@/utils/urls'

export interface FeaturedPacksProps {
  featuredPacks: PublishedPack[]
}

export default function FeaturedPacks({ featuredPacks }: FeaturedPacksProps) {
  const { t } = useTranslation()

  const columns = 5
  const locale = useLocale()

  return (
    <Grid base={2} md={3} lg={4} gapMd={6} gapSm={8}>
      {featuredPacks.map((pack, index) => {
        const releaseDate = new Date(pack.releasedAt)

        return (
          <AppLink
            className={css.packLink}
            key={pack.templateId}
            href={urlFor(urls.releasePack, { packSlug: pack.slug })}
          >
            <div className={css.packImage}>
              <Image
                alt={pack.title}
                className={css.packImage}
                height={250}
                layout="responsive"
                objectFit="cover"
                src={pack.image}
                width={250}
                priority={index < columns ? true : false}
              />
            </div>
            <h4 className={css.packTitle}>{pack.title}</h4>
            <p className={css.packDropTime}>
              {isBeforeNow(releaseDate)
                ? `${t('release:Released on')} `
                : `${t('release:Drops')} `}
              <span className="inline-block">
                {releaseDate.toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </p>
          </AppLink>
        )
      })}
    </Grid>
  )
}
