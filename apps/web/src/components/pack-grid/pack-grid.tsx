import { PackWithCollectibles } from '@algomart/schemas'
import { animated, config, useTrail } from '@react-spring/web'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './pack-grid.module.css'

import Button from '@/components/button'
import PackItem from '@/components/pack-grid/pack-item'
import PackPlaceholder from '@/components/pack-grid/pack-placeholder'

export interface PackGridProps {
  packCards: PackWithCollectibles['collectibles']
  packTitle: PackWithCollectibles['title']
  transitionStyle?: 'automatic' | 'interactive'
}

export default function PackGrid({
  packCards,
  packTitle,
  transitionStyle = 'automatic',
}: PackGridProps) {
  const { t } = useTranslation()

  // Automatic animations
  const animationIn = useTrail(packCards.length, {
    config: config.gentle,
    delay: 3000,
    from: { opacity: 0, y: -50 },
    to: { opacity: 1, y: 0 },
  })
  const animationOpacity = useTrail(packCards.length, {
    config: config.molasses,
    delay: 1000,
    from: { opacity: 0 },
    to: { opacity: 1 },
  })

  // Interactive animations
  const [flippedCards, setFlippedCards] = useState<boolean[]>(
    Array.from({ length: packCards.length }, () => false)
  )

  const isInteractive = transitionStyle === 'interactive'

  const handleFlip = (index: number) => {
    setFlippedCards((cards) => {
      return cards.map((card, index_) => (index_ === index ? true : card))
    })
  }
  const handleFlipAll = () => {
    setFlippedCards((cards) => {
      return cards.map(() => true)
    })
  }

  return (
    <>
      {isInteractive && (
        <div className={css.toggleButton}>
          <Button onClick={handleFlipAll} size="small" variant="secondary">
            {t('common:actions.Reveal All')}
          </Button>
        </div>
      )}
      <ul className={css.gridWrapper}>
        {animationIn.map((style, index) => {
          return (
            <animated.li
              className={css.gridItem}
              key={packCards[index].id}
              onClick={isInteractive ? () => handleFlip(index) : undefined}
              style={style}
            >
              <PackItem
                color={packCards[index]?.rarity?.color}
                imageSource={packCards[index].image}
                labelName={packCards[index]?.rarity?.name}
                title={packCards[index].title}
              />
              <animated.div
                className={clsx(css.placeholderWrapper, {
                  [css.fadeable]: !isInteractive,
                  [css.clickable]: isInteractive,
                  [css.fadedOut]: isInteractive && flippedCards[index],
                })}
                style={
                  isInteractive
                    ? undefined
                    : {
                        opacity: animationOpacity[index].opacity.to({
                          range: [0, 1],
                          output: [1, 0],
                        }),
                      }
                }
              >
                <PackPlaceholder
                  index={index}
                  key={packCards[index].id}
                  collectibleEdition={`#${packCards[index].edition}`}
                  packTitle={packTitle}
                  packItemNumber={index + 1}
                  packTotalCount={packCards.length}
                />
              </animated.div>
            </animated.li>
          )
        })}
      </ul>
    </>
  )
}
