import { ExclamationCircleIcon } from '@heroicons/react/outline'

import css from './wallet-transfers.module.css'

import { H2 } from '@/components/heading'
import LinkButton from '@/components/link-button'

export interface ErrorStageProps {
  linkText: string
  linkUrl: string
  errorTitle: string
  errorSubtitle?: string
}

export default function ErrorStage(props: ErrorStageProps) {
  return (
    <div key="error" className={css.stage}>
      <div className={css.terminalStage}>
        <span className={css.error}>
          <ExclamationCircleIcon width={48} />
        </span>
        <H2 size={1} my={5}>
          {props.errorTitle}
        </H2>
        {props.errorSubtitle ? (
          <div className={css.terminalStageSubtitle}>{props.errorSubtitle}</div>
        ) : null}
        <LinkButton fullWidth href={props.linkUrl}>
          {props.linkText}
        </LinkButton>
      </div>
    </div>
  )
}
