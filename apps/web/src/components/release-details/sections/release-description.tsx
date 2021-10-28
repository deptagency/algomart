import clsx from 'clsx'
import Markdown from 'markdown-to-jsx'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './release-description.module.css'

export interface ReleaseDescriptionProps {
  description: string
}

export default function ReleaseDescription({
  description,
}: ReleaseDescriptionProps) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(description.length > 200)
  const handleToggle = () => setCollapsed(!collapsed)

  return (
    <div className={css.root}>
      <div
        className={clsx(css.collapseContainer, {
          [css.collapsed]: collapsed,
        })}
      >
        <Markdown options={{ forceBlock: true }}>{description}</Markdown>
      </div>
      {collapsed && (
        <>
          <div className={css.mask} />
          <button className={css.readMore} onClick={handleToggle}>
            {t('common:actions.Read More')}
          </button>
        </>
      )}
    </div>
  )
}
