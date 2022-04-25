import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './release-filter.module.css'

import Heading from '@/components/heading'
import Toggle from '@/components/toggle/toggle'
import { useProductFilterContext } from '@/contexts/product-filter-context'
import { productFilterActions } from '@/hooks/use-product-filter'

export default function ReleaseFilterType() {
  const { t } = useTranslation()
  const { dispatch, state } = useProductFilterContext()

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
              dispatch(productFilterActions.setShowPurchase(checked))
            }}
          />
        </div>
        <div className={css.filterItem}>
          <Toggle
            checked={state.showAuction}
            label={t('release:filters.Auction')}
            onChange={(checked) => {
              dispatch(productFilterActions.setShowAuction(checked))
            }}
          />
        </div>
      </div>
      <div className={css.filterRow}>
        <div className={css.filterItem}>
          <Toggle
            checked={state.showSecondaryMarket}
            label={t('releases:filters.Secondary Market')}
            onChange={(checked) => {
              dispatch(productFilterActions.setShowSecondaryMarket(checked))
            }}
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
                  dispatch(productFilterActions.setShowAuctionUpcoming(checked))
                }}
              />
            </div>
            <div className={css.filterItem}>
              <Toggle
                checked={state.showAuctionActive}
                label={t('release:filters.Auction is live')}
                onChange={(checked) => {
                  dispatch(productFilterActions.setShowAuctionActive(checked))
                }}
              />
            </div>
            <div className={css.filterItem}>
              <Toggle
                checked={state.showAuctionExpired}
                label={t('release:filters.Has ended')}
                onChange={(checked) => {
                  dispatch(productFilterActions.setShowAuctionExpired(checked))
                }}
              />
            </div>
          </div>
          <div className={css.filterRow}>
            <div className={css.filterItem}>
              <Toggle
                checked={state.showAuctionReserveMet}
                label={t('release:filters.Reserve met')}
                onChange={(checked) => {
                  dispatch(
                    productFilterActions.setShowAuctionReserveMet(checked)
                  )
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
