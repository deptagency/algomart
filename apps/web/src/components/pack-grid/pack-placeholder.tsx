import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './pack-placeholder.module.css'
export interface PackPlaceholderProps {
  collectibleEdition: string
  hideContent?: boolean
  index: number
  packItemNumber: number
  packTitle: string
  packTotalCount: number
}
export default function PackPlaceholder({
  hideContent,
  collectibleEdition,
  index,
  packItemNumber,
  packTitle,
  packTotalCount,
}: PackPlaceholderProps) {
  const { t } = useTranslation()
  return (
    <div
      className={clsx(css.root, css[`backgroundPosition-${(index + 1) % 6}`], {
        [css.hideContent]: hideContent,
      })}
    >
      <div className={css.questionMark}>?</div>
      {!hideContent && (
        <>
          <div className={css.packName}>{packTitle}</div>
          <div className={css.infoWrapper}>
            <div className={clsx(css.infoWrapperColumn, css.infoWrapperLeft)}>
              {collectibleEdition}
            </div>
            <div className={clsx(css.infoWrapperColumn, css.infoWrapperRight)}>
              {`${packItemNumber} ${t(
                'collection:viewer.of'
              )} ${packTotalCount}`}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
