import useTranslation from 'next-translate/useTranslation'

import css from './browse-products-filters.module.css'

import FormField from '@/components/form-field'
import { H2 } from '@/components/heading'
import Toggle from '@/components/toggle/toggle'
import { usePackFilter } from '@/hooks/use-pack-filter'

export default function BrowseProductsFilterType() {
  const { t } = useTranslation()
  const { getUpdateHandler, ...state } = usePackFilter()

  return (
    <>
      <div className={css.root}>
        <div className={css.filterHeader}>
          <H2 size={4}>{t('drops:filters.Type of Sale')}</H2>
        </div>
        <div className={css.filterRow}>
          <FormField density="compact">
            <Toggle
              checked={state.showPurchase}
              label={t('drops:filters.Purchase')}
              onChange={getUpdateHandler('showPurchase')}
            />
          </FormField>
          <FormField density="compact" noMargin>
            <Toggle
              checked={state.showAuction}
              label={t('drops:filters.Auction')}
              onChange={getUpdateHandler('showAuction')}
            />
          </FormField>
        </div>
      </div>

      {state.showAuction && (
        <div className={css.root}>
          <div className={css.filterHeader}>
            <H2 size={4}>{t('drops:filters.Auction Status')}</H2>
          </div>
          <div className={css.filterRow}>
            <FormField density="compact">
              <Toggle
                checked={state.showAuctionUpcoming}
                label={t('drops:filters.Starting soon')}
                onChange={getUpdateHandler('showAuctionUpcoming')}
              />
            </FormField>
            <FormField density="compact">
              <Toggle
                checked={state.showAuctionActive}
                label={t('drops:filters.Auction is live')}
                onChange={getUpdateHandler('showAuctionActive')}
              />
            </FormField>
            <FormField density="compact">
              <Toggle
                checked={state.showAuctionExpired}
                label={t('drops:filters.Has ended')}
                onChange={getUpdateHandler('showAuctionExpired')}
              />
            </FormField>
            <FormField density="compact" noMargin>
              <Toggle
                checked={state.showAuctionReserveMet}
                label={t('drops:filters.Reserve met')}
                onChange={getUpdateHandler('showAuctionReserveMet')}
              />
            </FormField>
          </div>
        </div>
      )}
    </>
  )
}
