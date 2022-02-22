import { PublishedPack } from '@algomart/schemas'
import Image from 'next/image'

import css from './featured-packs.module.css'

import AppLink from '@/components/app-link/app-link'
import Grid from '@/components/grid/grid'
import { cmsImageLoader } from '@/utils/cms-image-loader'
import { urls } from '@/utils/urls'

export interface FeaturedPacksProps {
  featuredPacks: PublishedPack[]
}

export default function FeaturedPacks({ featuredPacks }: FeaturedPacksProps) {
  return (
    <Grid columns={5}>
      {featuredPacks.map((pack) => (
        <AppLink
          className={css.packLink}
          key={pack.templateId}
          href={urls.release.replace(':packSlug', pack.slug)}
        >
          <div className={css.packImage}>
            <Image
              alt={pack.title}
              className={css.packImage}
              height={250}
              layout="responsive"
              loader={cmsImageLoader}
              objectFit="cover"
              src={pack.image}
              width={250}
            />
          </div>
          <div className={css.packTitle}>{pack.title}</div>
        </AppLink>
      ))}
    </Grid>
  )
}
