import { RefreshIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './pending-credits.module.css'

import EllipsisLoader from '@/components/ellipsis-loader'
import { usePendingCreditsContext } from '@/contexts/pending-credits-context'
import { formatCredits } from '@/utils/currency'

interface ICredits {
  className?: string
}

/**
 * Finds pending credits and displays amount
 */
export default function PendingCredits({ className }: ICredits) {
  const { t } = useTranslation()
  const {
    findPendingCredits,
    isOutOfRetries,
    someCreditsArePending,
    sumPendingCredits,
  } = usePendingCreditsContext()

  return (
    someCreditsArePending && (
      <div className={clsx(css.background, className)}>
        {formatCredits(sumPendingCredits)}
        {` ${t('common:statuses.Pending')}`}
        {isOutOfRetries ? (
          <RefreshIcon
            className={css.refreshIcon}
            onClick={() => findPendingCredits()}
          />
        ) : (
          <EllipsisLoader inline />
        )}
      </div>
    )
  )
}
