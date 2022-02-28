import { PublishedPack } from '@algomart/schemas'
import Markdown from 'markdown-to-jsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './featured-pack.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'

export interface FeaturedPackProps {
  authenticated: boolean
  featuredPack: PublishedPack
  banner?: string
  subtitle?: string
  title?: string
  onClickFeatured: () => void
}

export default function HomeTemplate({
  authenticated,
  banner,
  featuredPack,
  onClickFeatured,
  subtitle,
  title,
}: FeaturedPackProps) {
  const { t } = useTranslation()

  return (
    <section className={css.featured}>
      <div className={css.featuredNotice}>
        {t('release:Limited Edition N Remaining', {
          available: featuredPack.available,
        })}
      </div>

      <section
        className={css.banner}
        style={{
          backgroundImage: banner ? `url("${banner}")` : 'none',
        }}
      >
        {/* Columns */}
        <div className={css.featuredColumns}>
          {/* Image */}
          <div className={css.featuredImage}>
            <Image
              alt={featuredPack.title}
              src={featuredPack.image}
              width={512}
              height={512}
              layout="responsive"
              objectFit="cover"
            />
          </div>

          <div className={css.featuredContent}>
            <Heading className={css.featuredHeading} level={2} bold>
              {authenticated ? featuredPack.title : title}
            </Heading>
            {featuredPack.body ? (
              <div className={css.featuredBody}>
                {authenticated ? (
                  <Markdown options={{ forceBlock: true }}>
                    {featuredPack.body}
                  </Markdown>
                ) : (
                  subtitle
                )}
              </div>
            ) : null}

            <div className={css.featuredControls}>
              <Button onClick={onClickFeatured} size="medium" rounded>
                {authenticated
                  ? t('common:actions.Buy Now')
                  : t('common:actions.Create Account')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </section>
  )
}
