import { ExternalLinkIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useMemo } from 'react'

import common from './my-profile-common.module.css'
import css from './my-profile-wallet.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { useAuth } from '@/contexts/auth-context'

export default function MyWallet() {
  const { user } = useAuth()
  const { t } = useTranslation()

  const formattedAddress = useMemo(() => {
    const addr = user?.address as string
    const first6 = addr.slice(0, 6)
    const last6 = addr.slice(-6, addr.length)
    return `${first6}...${last6}`
  }, [user?.address])

  const handleCopy = useCallback(() => {
    if (navigator) {
      navigator.clipboard.writeText(user?.address as string)
    }
  }, [user?.address])

  const handleView = useCallback(() => {
    if (window) {
      window.open(`https://algoexplorer.io/address/${user?.address as string}`)
    }
  }, [user?.address])

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <Heading className={common.sectionHeading} level={2}>
          {t('profile:Algorand Wallet Address')}
        </Heading>
        <Button
          className={css.viewOnChainButton}
          onClick={handleView}
          variant="link"
          size="small"
        >
          {t('common:actions.View On AlgoExplorer')}
          <ExternalLinkIcon height="16px" />
        </Button>
      </div>
      <div className={common.sectionContent}>
        <div className={css.columns}>
          <div>{formattedAddress}</div>
          <Button onClick={handleCopy} size="small">
            {t('common:actions.Copy')}
          </Button>
        </div>
      </div>
    </section>
  )
}
