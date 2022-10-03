import {
  CollectibleBase,
  Faq,
  PublishedPack,
  RarityBase,
} from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import React, { useState } from 'react'

import css from './home-template.module.css'

import NotableCollectible from '@/components/collectibles/collectible-notable'
import FeaturedPacks from '@/components/featured-packs/featured-packs'
import { FeaturedRarity } from '@/components/featured-rarity/featured-rarity'
import Grid from '@/components/grid/grid'
import { H2 } from '@/components/heading'
import LinkButton from '@/components/link-button'
import { urls } from '@/utils/urls'

export interface HomeTemplateProps {
  authenticated: boolean
  featuredCollectibles: CollectibleBase[]
  featuredCollectiblesSubtitle?: string
  featuredCollectiblesTitle?: string
  featuredFaqs: Faq[]
  featuredPacks: PublishedPack[]
  featuredPacksSubtitle?: string
  featuredPacksTitle?: string
  featuredRarities?: RarityBase[]
}

export default function HomeTemplate({
  authenticated,
  featuredCollectibles,
  featuredCollectiblesSubtitle,
  featuredCollectiblesTitle,
  featuredFaqs,
  featuredPacks,
  featuredPacksSubtitle,
  featuredPacksTitle,
  featuredRarities,
}: HomeTemplateProps) {
  const { t } = useTranslation()

  return (
    <div className={css.root}>
      {featuredPacks?.length > 0 && (
        <div>
          <section className={css.section}>
            <p className={css.sectionSubtitle}>{featuredPacksSubtitle}</p>
            <H2 className={css.sectionTitle}>{featuredPacksTitle}</H2>
            <FeaturedPacks featuredPacks={featuredPacks} />
            <LinkButton className={css.sectionButton} href={urls.drops}>
              {t('common:actions.Browse Latest Releases')}
            </LinkButton>
          </section>
        </div>
      )}

      {featuredCollectibles?.length > 0 && (
        <section className={css.section}>
          <p className={css.sectionSubtitle}>{featuredCollectiblesSubtitle}</p>
          <H2 className={css.sectionTitle}>{featuredCollectiblesTitle}</H2>

          <div className={css.featuredCollectibles}>
            <Grid base={2} sm={3} md={4}>
              {featuredCollectibles.map((collectible) => (
                <NotableCollectible
                  collectible={collectible}
                  key={collectible.templateId}
                />
              ))}
            </Grid>
          </div>

          <LinkButton className={css.sectionButton} href={urls.drops}>
            {t('common:actions.Start Collecting')}
          </LinkButton>
        </section>
      )}

      {featuredRarities?.length > 0 && (
        <section className={css.section}>
          <H2 className={css.sectionTitle} uppercase>
            {t('common:rarityTiers')}
          </H2>
          <div className={css.featuredRarities}>
            <Grid base={1} sm={3} gapBase={8}>
              {featuredRarities.map((rarity) => (
                <FeaturedRarity
                  rarity={rarity}
                  key={rarity.code}
                  className={css.rarityItem}
                />
              ))}
            </Grid>
          </div>
        </section>
      )}

      {featuredFaqs && featuredFaqs.length > 0 && (
        <section className={css.section}>
          <H2 className={css.sectionTitle}>{t('common:pageTitles.FAQS')}</H2>
          <ul>
            {featuredFaqs.map(({ key, answer, question }) => (
              <FAQ question={question} answer={answer} key={key} faqKey={key} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function FAQ({
  faqKey,
  question,
  answer,
}: {
  faqKey: Faq['key']
  question: Faq['question']
  answer: Faq['answer']
}) {
  const [isOpen, setIsOpen] = useState(false)
  const handleToggleCollapse = () => {
    setIsOpen(!isOpen)
  }
  const questionId = `Q-${faqKey}`
  const answerId = `A-${faqKey}`

  return (
    <li className={clsx(css.faq, { [css.expanded]: isOpen })}>
      <h4 className={css.faqQuestion}>
        <button
          onClick={handleToggleCollapse}
          id={questionId}
          aria-expanded={isOpen}
          aria-controls={answerId}
        >
          {question}
        </button>
      </h4>
      {isOpen && (
        <div
          id={answerId}
          role="region"
          aria-labelledby={questionId}
          className={css.faqAnswer}
          dangerouslySetInnerHTML={{ __html: answer }}
        />
      )}
    </li>
  )
}
