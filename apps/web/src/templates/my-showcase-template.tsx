import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import css from './my-showcase-template.module.css'

import Button from '@/components/button'
import CollectibleItem from '@/components/collectibles/collectible-item'
import CollectiblePlaceholder from '@/components/collectibles/collectible-placeholder'
import CollectibleShowcase from '@/components/collectibles/collectible-showcase'
import Grid from '@/components/grid/grid'
import Heading from '@/components/heading'
import Notification from '@/components/notification/notification'
import Pagination from '@/components/pagination/pagination'
import Tabs from '@/components/tabs/tabs'
import { useAuth } from '@/contexts/auth-context'
import { getCollectionTabs } from '@/utils/collections'

export interface MyShowcaseTemplateProps {
  addCollectible: (collectibleId: string) => void
  collectibles: CollectibleWithDetails[]
  collectiblesTotal: number
  handleRedirectBrands: () => void
  page: number
  pageSize: number
  showcaseCollectibles: CollectibleWithDetails[]
  removeCollectible: (collectibleId: string) => void
  setPage: (index: number) => void
  setShareProfile: (shareProfile: boolean) => void
  shareProfile: boolean
}

export default function MyShowcaseTemplate({
  addCollectible,
  collectibles,
  collectiblesTotal,
  handleRedirectBrands,
  page,
  pageSize,
  showcaseCollectibles,
  removeCollectible,
  setPage,
  setShareProfile,
  shareProfile,
}: MyShowcaseTemplateProps) {
  const { t } = useTranslation()
  const auth = useAuth()
  const [showNotification, setShowNotification] = useState<boolean>(false)
  const slotsAreFull = showcaseCollectibles.length === 8

  const getMode = useCallback(
    (collectibleId: string) => {
      const matching = showcaseCollectibles.find(
        ({ id }) => id === collectibleId
      )
      if (matching) return 'selected'
      if (!slotsAreFull) return 'add'
      return
    },
    [showcaseCollectibles, slotsAreFull]
  )

  const handleClick = useCallback(
    (collectibleId: string) => {
      setShowNotification(false)
      const matching = showcaseCollectibles.find(
        ({ id }) => id === collectibleId
      )
      if (matching) return removeCollectible(collectibleId)
      if (!slotsAreFull) return addCollectible(collectibleId)
      setShowNotification(true)
      return
    },
    [addCollectible, removeCollectible, showcaseCollectibles, slotsAreFull]
  )

  return (
    <>
      {/* Tabs */}
      <Tabs activeTab={2} tabs={getCollectionTabs(t)} />

      {/* Showcase Grid */}
      <section>
        <CollectibleShowcase
          onClickCollectible={removeCollectible}
          collectibles={showcaseCollectibles}
          mode="editing"
          username={auth.user?.username}
          initialPublish={shareProfile}
          onTogglePublish={setShareProfile}
        />

        {/* Showcase-able collecibles */}
        <div className={css.ownedCollectiblesWrapper}>
          <Heading className={css.ownedCollectiblesHeading} level={3}>
            {t('collection:viewer.selectCollectibles')}:
          </Heading>

          {showNotification && (
            <Notification
              className={css.notification}
              content={t('collection:viewer.maxCollectibles')}
              variant="red"
            />
          )}

          {collectibles && collectibles.length > 0 ? (
            <Grid>
              {collectibles.map((collectible) => (
                <CollectibleItem
                  key={collectible.id}
                  alt={collectible.title}
                  title={collectible.title}
                  imageUrl={collectible.image}
                  mode={getMode(collectible.id)}
                  onClick={() => handleClick(collectible.id)}
                />
              ))}
            </Grid>
          ) : (
            <div className={css.noCollectiblesWrapper}>
              <CollectiblePlaceholder
                className={css.noCollectiblesPlaceholder}
              />
              <Heading className={css.noCollectiblesHeading} level={3}>
                {t('collection:viewer.noCollectibles')}
              </Heading>
            </div>
          )}
        </div>

        <Pagination
          currentPage={page}
          pageSize={pageSize}
          setPage={setPage}
          total={collectiblesTotal}
        />
      </section>

      {/* Bottom CTA */}
      {collectiblesTotal === 0 && (
        <div className={css.bottomCtaWrapper}>
          <Button onClick={handleRedirectBrands}>
            {t('collection:viewer.Find Something Cool')}
          </Button>
        </div>
      )}
    </>
  )
}
