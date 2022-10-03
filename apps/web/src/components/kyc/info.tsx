import { UserAccountStatus, WorkflowState } from '@algomart/schemas'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'

import css from './info.module.css'

import AppLink from '@/components/app-link/app-link'
import Button from '@/components/button'
import { H2 } from '@/components/heading'
import Loading from '@/components/loading/loading'
import Panel from '@/components/panel'
import { useKYCContext } from '@/contexts/kyc-context'
import { urls } from '@/utils/urls'

export default function KYCInfo() {
  const { t } = useTranslation()
  const {
    applicant,
    applicantId,
    handleRequestManualReview,
    handleReset,
    setIsModalOpen,
    userStatus,
  } = useKYCContext()
  const { firstName, lastName, workflow, address } = applicant || {}
  const { status: applicantStatus, isVerificationRequired } = userStatus || {}
  const isTryAgain =
    workflow.status === WorkflowState.cancelled &&
    applicantStatus === UserAccountStatus.Unverified
  const isRequestManualReview = applicantStatus === UserAccountStatus.Restricted
  const isManualReview = applicantStatus === UserAccountStatus.ManualReview
  const handleStartVerification = () => setIsModalOpen(true)

  const displayStatus: string | null = applicantStatus
    ? t(
        `forms:fields.customerVerification.accountStatus.options.${applicantStatus}`
      )
    : null
  const workflowStatus: string | null = workflow?.status
    ? t(
        `forms:fields.customerVerification.lastAttempt.status.options.${workflow.status}`
      )
    : null

  if (!applicantId || !applicant) {
    return <Loading className="my-32" />
  }

  return (
    <>
      <p className={css.message}>
        <span>{t('forms:fields.customerVerification.helpText.1')} </span>
        <span>{t('forms:fields.customerVerification.helpText.2')}</span>
      </p>
      <p className={css.messageLink}>
        <Trans
          components={[
            <AppLink
              key="0"
              className="underline"
              target="_blank"
              href={urls.amlPolicy}
            />,
          ]}
          i18nKey="forms:fields.customerVerification.cta"
        />
      </p>
      <hr />
      <div className={css.details}>
        <H2 mb={5}>{t('forms:sections.Verification Details')}</H2>
        <div className={css.fieldGroup}>
          <p className={css.field}>
            <span className={css.key}>
              {t('forms:fields.customerVerification.accountStatus.label')}:
            </span>
            <span className={css.value}>{displayStatus}</span>
          </p>
          <p className={css.field}>
            <span className={css.key}>
              {t('forms:fields.customerVerification.required.label')}:
            </span>
            <span className={css.value}>
              {isVerificationRequired
                ? t(
                    'forms:fields.customerVerification.required.options.required'
                  )
                : t(
                    'forms:fields.customerVerification.required.options.notRequired'
                  )}
            </span>
          </p>
        </div>
        <div className={css.initiateButton}>
          <Button
            busy={isManualReview}
            onClick={
              isTryAgain
                ? () => handleReset()
                : isRequestManualReview
                ? () => handleRequestManualReview()
                : () => handleStartVerification()
            }
          >
            {isTryAgain
              ? t('common:actions.Try Again')
              : isRequestManualReview
              ? t('common:actions.Request Manual Review')
              : t('common:actions.Start Verification Check')}
          </Button>
        </div>
        <Panel
          className={css.panel}
          title={t('forms:sections.Current Verification')}
          fullWidth
          hScrollContent
        >
          <ul className={css.list}>
            <li className={css.listItem}>
              <span className={css.listLabel}>
                {t(
                  'forms:fields.customerVerification.lastAttempt.status.label'
                )}
                :
              </span>
              <span className={css.listValue}>{workflowStatus}</span>
            </li>
            <li className={css.listItem}>
              <span className={css.listLabel}>
                {t('forms:fields.fullName.label')}:
              </span>
              <span className={css.listValue}>
                {firstName} {lastName}
              </span>
            </li>
            <li className={css.listItem}>
              <span className={css.listLabel}>
                {t('forms:fields.address1.label')}:
              </span>
              <div className={css.listValue}>
                {address?.street || address?.subStreet ? (
                  <>
                    {address?.street && <p>{address?.street} </p>}
                    {address?.subStreet && <p>{address?.subStreet}</p>}
                  </>
                ) : address?.line1 || address?.line2 || address?.line3 ? (
                  <>
                    {address?.line1 && <p>{address?.line1}</p>}
                    {address?.line2 && <p>{address?.line2}</p>}
                    {address?.line3 && <p>{address?.line3}</p>}
                  </>
                ) : null}
                {address?.buildingName && <p>{address?.buildingName}</p>}
                {address?.buildingNumber && <p>{address?.buildingNumber}</p>}
                {address?.flatNumber && <p>{address?.flatNumber}</p>}
                <p>
                  {address?.town && (
                    <>
                      {address?.town}
                      {address?.state && ', '}
                    </>
                  )}
                  {address?.state && <>{address?.state} </>}
                  {address?.postcode && <>{address?.postcode}</>}
                </p>
                {address?.country && <p>{address?.country}</p>}
              </div>
            </li>
          </ul>
          <div className={css.sectionContent}>
            <p className={css.sectionText}>
              {t('forms:fields.customerVerification.lastAttempt.helpText')}
            </p>
            <Button onClick={() => handleReset()} variant="secondary">
              {t('common:actions.Edit Applicant Details')}
            </Button>
          </div>
        </Panel>
      </div>
    </>
  )
}
