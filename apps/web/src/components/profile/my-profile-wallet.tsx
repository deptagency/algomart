import { ExternalLinkIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useMemo } from 'react'

import ExternalLink from '../external-link'

import common from './my-profile-common.module.css'
import css from './my-profile-wallet.module.css'

import Button from '@/components/button'
import { H2 } from '@/components/heading'
import { AppConfig } from '@/config'
import { useAuth } from '@/contexts/auth-context'
import { formatAlgoAddress } from '@/utils/format-string'

export default function MyWallet() {
  const { user } = useAuth()
  const { t } = useTranslation()

  const formattedAddress = useMemo(() => {
    return formatAlgoAddress(user?.address || '')
  }, [user?.address])

  const handleCopy = useCallback(() => {
    if (navigator) {
      navigator.clipboard.writeText(user?.address as string)
    }
  }, [user?.address])

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <H2 className={common.sectionHeading}>
          {t('profile:Algorand Wallet Address')}
        </H2>
        <ExternalLink
          className={css.viewOnChainButton}
          href={`${AppConfig.algoExplorerBaseURL}/address/${
            user?.address as string
          }`}
        >
          {t('common:actions.View On AlgoExplorer')}
          <ExternalLinkIcon height="16px" />
        </ExternalLink>
      </div>
      <div className={common.sectionContent}>
        <div className={css.columns}>
          <div>{formattedAddress}</div>
          <Button onClick={handleCopy}>{t('common:actions.Copy')}</Button>
        </div>
      </div>
    </section>
  )
}
