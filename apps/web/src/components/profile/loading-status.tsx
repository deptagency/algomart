import useTranslation from 'next-translate/useTranslation'

import Loading from '@/components/loading/loading'

export interface LoadingStatusProps {
  status?: string
}

export default function LoadingStatus({ status }: LoadingStatusProps) {
  const { t } = useTranslation()

  const loadingText = status ? status : t('common:statuses.Loading')

  return (
    <div className="text-center">
      <Loading loadingText={loadingText} variant="secondary" />
    </div>
  )
}
