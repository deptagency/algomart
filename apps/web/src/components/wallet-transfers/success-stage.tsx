import { CheckCircleIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'

import css from './wallet-transfers.module.css'

import { H1 } from '@/components/heading'
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
        <H1 my={5}>{t('nft:walletConnect.sent')}</H1>
        <LinkButton fullWidth href={props.linkUrl}>
          {props.linkText}
        </LinkButton>
      </div>
    </div>
  )
}
