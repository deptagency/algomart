import { CheckCircleIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'

import css from './wallet-transfers.module.css'

import Heading from '@/components/heading'
import LinkButton from '@/components/link-button'

export interface SuccessStageProps {
  linkUrl: string
  linkText: string
}

export default function SuccessStage(props: SuccessStageProps) {
  const { t } = useTranslation()
  return (
    <div key="success" className={css.stage}>
      <div className={css.terminalStage}>
        <span className={css.success}>
          <CheckCircleIcon width={48} />
        </span>
        <Heading bold level={2} size={1} className={css.terminalStageTitle}>
          {t('nft:walletConnect.sent')}
        </Heading>
        <LinkButton fullWidth href={props.linkUrl}>
          {props.linkText}
        </LinkButton>
      </div>
    </div>
  )
}
