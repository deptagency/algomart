import { ExclamationCircleIcon } from '@heroicons/react/outline'

import css from './wallet-transfers.module.css'

import Heading from '@/components/heading'
import LinkButton from '@/components/link-button'

export interface ErrorStageProps {
  linkText: string
  linkUrl: string
  error: string
}

export default function ErrorStage(props: ErrorStageProps) {
  return (
    <div key="error" className={css.stage}>
      <div className={css.terminalStage}>
        <span className={css.error}>
          <ExclamationCircleIcon width={48} />
        </span>
        <Heading bold level={2} size={1} className={css.terminalStageTitle}>
          {props.error}
        </Heading>
        <LinkButton fullWidth href={props.linkUrl}>
          {props.linkText}
        </LinkButton>
      </div>
    </div>
  )
}
