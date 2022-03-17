import { ExclamationCircleIcon } from '@heroicons/react/outline'

import Heading from '../heading'
import LinkButton from '../link-button'

import css from './wallet-transfers.module.css'

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
