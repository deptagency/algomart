import { ReactNode } from 'react'

import AppLink from '../app-link/app-link'

import css from './main-panel-header.module.css'

import { H1 } from '@/components/heading'
import { ReactComponent as CloseCircleSvg } from '@/svgs/close-circle.svg'

interface Props {
  title: ReactNode
  backFn?: () => void
  backLink?: string
}

export default function MainPanelHeader({ backFn, backLink, title }: Props) {
  function CloseLink() {
    return (
      <AppLink href={backLink} className={css.closeIcon}>
        <CloseCircleSvg width="50" />
      </AppLink>
    )
  }

  return (
    <H1 className={css.mainPanelHeader}>
      {title}
      <div>
        {backLink && <CloseLink />}
        {backFn && (
          <CloseCircleSvg onClick={backFn} className={css.closeIcon} />
        )}
      </div>
    </H1>
  )
}
