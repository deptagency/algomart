import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './release-filter.module.css'

import Heading from '@/components/heading'
import Toggle from '@/components/toggle/toggle'
import { usePackFilterContext } from '@/contexts/pack-filter-context'
import { packFilterActions } from '@/hooks/usePackFilter'

export default function ReleaseFilterType() {
  const { t } = useTranslation()
  const { dispatch, state } = usePackFilterContext()

  return (
    <div className={css.root}>
      <div className={clsx(css.filterRow, css.filterHeader)}>
        <Heading level={2}>{t('release:filters.Type of Sale')}</Heading>
      </div>
      <div className={css.filterRow}>
        <div className={css.filterItem}>
          <Toggle
            checked={state.showPurchase}
            label={t('release:filters.Purchase')}
            onChange={(checked) => {
              dispatch(packFilterActions.setShowPurchase(checked))
            }}
            styleMode="dark"
          />
        </div>
        <div className={css.filterItem}>
          <Toggle
            checked={state.showAuction}
            label={t('release:filters.Auction')}
            onChange={(checked) => {
              dispatch(packFilterActions.setShowAuction(checked))
            }}
            styleMode="dark"
          />
        </div>
      </div>

      {state.showAuction && (
        <>
          <div className={clsx(css.filterRow, css.filterHeader)}>
            <Heading level={2}>{t('release:filters.Auction Status')}</Heading>
          </div>
          <div className={css.filterRow}>
            <div className={css.filterItem}>
              <Toggle
                checked={state.showAuctionUpcoming}
                label={t('release:filters.Starting soon')}
                onChange={(checked) => {
                  dispatch(packFilterActions.setShowAuctionUpcoming(checked))
                }}
                styleMode="dark"
              />
            </div>
            <div className={css.filterItem}>
              <Toggle
                checked={state.showAuctionActive}
                label={t('release:filters.Auction is live')}
                onChange={(checked) => {
                  dispatch(packFilterActions.setShowAuctionActive(checked))
                }}
                styleMode="dark"
              />
            </div>
            <div className={css.filterItem}>
              <Toggle
                checked={state.showAuctionExpired}
                label={t('release:filters.Has ended')}
                onChange={(checked) => {
                  dispatch(packFilterActions.setShowAuctionExpired(checked))
                }}
                styleMode="dark"
              />
            </div>
          </div>
          <div className={css.filterRow}>
            <div className={css.filterItem}>
              <Toggle
                checked={state.showAuctionReserveMet}
                label={t('release:filters.Reserve met')}
                onChange={(checked) => {
                  dispatch(packFilterActions.setShowAuctionReserveMet(checked))
                }}
                styleMode="dark"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
