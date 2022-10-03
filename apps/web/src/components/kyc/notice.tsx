import { ExclamationCircleIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'

import css from './notice.module.css'

import AppLink from '@/components/app-link/app-link'
import { H2 } from '@/components/heading'
import LinkButton from '@/components/link-button'
import { urls } from '@/utils/urls'

export default function KYCNotice({
  isCashOut = false,
  isFullWidth = false,
}: {
  isCashOut?: boolean
  isFullWidth?: boolean
}) {
  const { t } = useTranslation()
  const notice = isCashOut
    ? 'common:statuses.verificationRequiredToCashout'
    : 'common:statuses.verificationRequired'
  return (
    <div
      className={clsx(css.root, {
        [css.halfWidth]: !isFullWidth,
        [css.fullWidth]: isFullWidth,
      })}
    >
      <ExclamationCircleIcon className={css.icon} />
      <H2 bold mb={16}>
        <Trans
          components={[
            <AppLink
              key={1}
              href={urls.myVerification}
              className="font-bold underline"
            />,
          ]}
          i18nKey={notice}
        />
      </H2>
      <LinkButton
        className={css.button}
        href={urls.myVerification}
        size="small"
      >
        {t('common:actions.Attempt Verification')}
      </LinkButton>
    </div>
  )
}
