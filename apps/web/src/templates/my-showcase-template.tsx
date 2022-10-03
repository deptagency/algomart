import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import common from './common-template-styles.module.css'
import css from './my-showcase-template.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import CollectibleItem from '@/components/collectibles/collectible-item'
import CollectiblePlaceholder from '@/components/collectibles/collectible-placeholder'
import CollectibleShowcase from '@/components/collectibles/collectible-showcase'
import Grid from '@/components/grid/grid'
import { H1, H2 } from '@/components/heading'
import LinkButton from '@/components/link-button'
import Pagination from '@/components/pagination/pagination'
import Tabs from '@/components/tabs/tabs'
import { useAuth } from '@/contexts/auth-context'
import { getCollectionTabs } from '@/utils/collections'
import { urls } from '@/utils/urls'

export interface MyShowcaseTemplateProps {
  addCollectible: (collectibleId: string) => void
  collectibles: CollectibleWithDetails[]
  collectiblesTotal: number
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

  return (
    <>
      <H1 className={common.pageHeading}>
        {t('common:pageTitles.My Showcase')}
      </H1>

      <Tabs activeTab={2} tabs={getCollectionTabs(t)} />

      <section>
        <CollectibleShowcase
          collectibles={showcaseCollectibles}
          initialPublish={shareProfile}
          mode="editing"
          onClickCollectible={removeCollectible}
          onTogglePublish={setShareProfile}
          username={auth.user?.username}
        />

        {/* Showcase-able collecibles */}
        <div className={css.ownedCollectiblesWrapper}>
          <H2 className={css.ownedCollectiblesHeading} uppercase>
            {t('collection:viewer.selectCollectibles')}:
          </H2>

          {showNotification && (
            <AlertMessage
              className={css.notification}
              content={t('collection:viewer.maxCollectibles')}
              variant="red"
            />
          )}

          {collectibles && collectibles.length > 0 ? (
            <Grid base={2} md={3} lg={4}>
              {collectibles.map((collectible) => (
                <CollectibleItem
                  collectible={collectible}
                  key={collectible.id}
                  onClick={() => handleClick(collectible.id)}
                  mode={getMode(collectible.id)}
                />
              ))}
            </Grid>
          ) : (
            <div className={css.noCollectiblesWrapper}>
              <CollectiblePlaceholder
                className={css.noCollectiblesPlaceholder}
              />
              <H2 className={css.noCollectiblesHeading}>
                {t('collection:viewer.noCollectibles')}
              </H2>
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
          <LinkButton href={urls.drops}>
            {t('collection:viewer.Find Something Cool')}
          </LinkButton>
        </div>
      )}
    </>
  )
}
