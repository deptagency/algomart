import { PackStatus, PackType } from '@algomart/schemas'
import { useRouter } from 'next/router'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'

import css from './release-cta.module.css'

import AppLink from '@/components/app-link/app-link'
import Button from '@/components/button'
import { useAuth } from '@/contexts/auth-context'
import { urls } from '@/utils/urls'

export interface ReleaseCTAProps {
  disallowBuyOrClaim: boolean | null
  isOwner: boolean | null
  isWinningBidder: boolean | null
  onClick(): void
  releaseIsAvailable: boolean
  status: PackStatus
  type: PackType
}

export default function ReleaseCTA({
  disallowBuyOrClaim,
  isOwner,
  isWinningBidder,
  onClick,
  releaseIsAvailable,
  status,
  type,
}: ReleaseCTAProps) {
  const { user } = useAuth()
  const { asPath } = useRouter()
  const { t } = useTranslation()
  const getText = () => {
    if (type === PackType.Purchase) return t('common:actions.Purchase')
    if (type === PackType.Auction) {
      if (isOwner) return t('common:actions.View My Collection')
      if (status === PackStatus.Expired && isWinningBidder)
        return t('common:actions.Claim NFT')
      return t('common:actions.Place Bid')
    }
    return t('common:actions.Claim My Edition')
  }

  if (!user) {
    return (
      <div className={css.root}>
        <p className={css.loginPrompt}>
          <Trans
            components={[
              <AppLink key={1} href={`${urls.login}?redirect=${asPath}`} />,
            ]}
            i18nKey="release:loginPrompt"
          />
        </p>
      </div>
    )
  }

  if (!releaseIsAvailable) {
    return (
      <div className={css.root}>
        <p className={css.actionNotAllowed}>{t('release:noLongerAvailable')}</p>
      </div>
    )
  }

  if (disallowBuyOrClaim) {
    return (
      <div className={css.root}>
        <p className={css.actionNotAllowed}>{t('release:limit1PerCustomer')}</p>
      </div>
    )
  }

  return (
    <div className={css.root}>
      <Button
        className={isWinningBidder || isOwner ? css.tealButton : ''}
        fullWidth
        onClick={onClick}
      >
        {getText()}
      </Button>
    </div>
  )
}
