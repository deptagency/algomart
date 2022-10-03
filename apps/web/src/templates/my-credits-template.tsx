import {
  CirclePayoutStatus,
  CircleTransferStatus,
  GetPaymentsMissingTransfersResponse,
  UserAccountTransferAction,
  UserAccountTransferHistory,
} from '@algomart/schemas'
import { addDays } from '@algomart/shared/utils'
import {
  ArrowCircleDownIcon,
  ArrowCircleUpIcon,
  ClockIcon,
  ExclamationIcon,
  ShoppingCartIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/outline'
import clsx from 'clsx'
import groupBy from 'lodash/groupBy'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'

import css from './my-credits-template.module.css'

import AppLink from '@/components/app-link/app-link'
import Credits from '@/components/currency/credits'
import PendingCredits from '@/components/currency/pending-credits'
import LinkButton from '@/components/link-button'
import Pagination, { PAGE_SIZE } from '@/components/pagination/pagination'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/hooks/use-locale'
import { isAfterDate } from '@/utils/date-time'
import { urlFor, urls } from '@/utils/urls'

interface MyCreditsTemplateProps {
  currentPage: number
  onPageChange(page: number): void
  totalTransfers: number
  transfers: UserAccountTransferHistory[]
  additionalPendingDeposits: GetPaymentsMissingTransfersResponse['payments']
}

export default function MyCreditsTemplate({
  currentPage,
  onPageChange,
  totalTransfers,
  transfers,
  additionalPendingDeposits,
}: MyCreditsTemplateProps) {
  const { user } = useAuth()
  const { t } = useTranslation()

  // Payments in the early stage of the deposit flow will be missing transfers
  // so these transfer objects are provided separately.
  // We always display them at the top and we don't paginate them
  // There should really only ever be at most one.
  const pendingTransfers = additionalPendingDeposits.map(
    ({ amount, createdAt, id }) => ({
      action:
        Number(amount) > 0
          ? UserAccountTransferAction.Deposit
          : UserAccountTransferAction.CashOut,
      amount,
      createdAt,
      entityId: id,
      status: CircleTransferStatus.Pending,
    })
  )

  const allTransfers = (
    currentPage === 1 ? [...pendingTransfers, ...transfers] : transfers
  ).sort((a, b) => (a.status === CircleTransferStatus.Pending ? 1 : 0))

  // We only want to show the most recent attempt for any given entity.
  const transfersByEntityId = groupBy(allTransfers, 'entityId')
  let dedupedTransfers = Object.values(transfersByEntityId).map(
    (group) =>
      group.sort(
        (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))
      )[0]
  )

  if (currentPage !== 1) {
    // should be very rare that this actually happens, but hide any failed transfers
    // associated with pending deposits if we're not on the first page. (If we're not
    // on the first page this de-duping wont happen in the statement above)
    dedupedTransfers = dedupedTransfers.filter(
      (transfer) =>
        !pendingTransfers.some((t) => t.entityId === transfer.entityId)
    )
  }

  const hasTransfers = dedupedTransfers.length > 0

  return (
    <>
      <div className={css.creditsContainer}>
        {/* Sorting filter */}
        <section className={css.creditsHeader}>
          <div className={css.creditBalanceValue}>
            <Credits value={user?.balance} />
          </div>
        </section>

        <PendingCredits />

        <section className={css.creditsActions}>
          {user ? (
            <div className="flex justify-center gap-4">
              <LinkButton
                data-e2e="add-money-button"
                className={css.creditActionButton}
                href={urls.purchaseCredits}
              >
                {t('common:actions.Add Money')}
              </LinkButton>
              <LinkButton
                className={css.creditActionButton}
                disabled={!user?.balance}
                href={urls.cashout}
              >
                {t('common:actions.Cash Out')}
              </LinkButton>
            </div>
          ) : (
            <p>
              <Trans
                components={[
                  <AppLink
                    key={0}
                    href={urlFor(urls.login, null, { redirect: urls.myWallet })}
                  />,
                ]}
                i18nKey="auth:Sign up to add balance"
              />
            </p>
          )}
        </section>
        {hasTransfers && (
          <ul>
            {dedupedTransfers.map((transfer) => (
              <TransferItem {...transfer} key={transfer.createdAt} />
            ))}
          </ul>
        )}
        {!hasTransfers && additionalPendingDeposits.length === 0 && user && (
          <div className={css.zeroStateContainer}>
            <div className={css.zeroStateWrapper}>
              {t('common:statuses.Try adding money')}

              <SwitchHorizontalIcon className={css.zeroStateIcon} />

              <LinkButton
                variant="outline"
                className={css.creditActionButton}
                href={urls.purchaseCredits}
              >
                {`${t('common:actions.Add Money Now')}`}
              </LinkButton>
            </div>
          </div>
        )}
      </div>
      {hasTransfers && (
        <div className={css.paginationWrapper}>
          <Pagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            setPage={onPageChange}
            total={totalTransfers}
          />
        </div>
      )}
    </>
  )
}

interface TransferIconProps {
  status: CircleTransferStatus
  action: UserAccountTransferAction
  hasSettled?: boolean
}
function TransferIcon({ status, action, hasSettled }: TransferIconProps) {
  return {
    [CircleTransferStatus.Complete]: {
      [UserAccountTransferAction.CollectibleSale]: hasSettled ? (
        <ShoppingCartIcon className={css.transferIcon} />
      ) : (
        <ClockIcon className={clsx(css.transferIcon, css.clockIcon)} />
      ),
      [UserAccountTransferAction.CollectiblePurchase]: hasSettled ? (
        <ShoppingCartIcon className={css.transferIcon} />
      ) : (
        <ClockIcon className={clsx(css.transferIcon, css.clockIcon)} />
      ),
      [UserAccountTransferAction.PackPurchase]: (
        <ShoppingCartIcon className={css.transferIcon} />
      ),
      [UserAccountTransferAction.CashOut]: (
        <ArrowCircleDownIcon className={css.transferIcon} />
      ),
      [UserAccountTransferAction.Deposit]: (
        <ArrowCircleUpIcon className={css.transferIcon} />
      ),
    }[action],
    [CircleTransferStatus.Pending]: (
      <ClockIcon className={clsx(css.transferIcon, css.clockIcon)} />
    ),
    [CircleTransferStatus.Failed]: (
      <ExclamationIcon
        className={clsx(css.transferIcon, css.exclamationIcon)}
      />
    ),
  }[status]
}

function TransferItem(
  props: Omit<UserAccountTransferHistory, 'type' | 'listing'>
) {
  const locale = useLocale()
  const { t } = useTranslation()

  const { amount, action, createdAt, collectible, pack, status, wirePayout } =
    props

  // Transfer type
  const isCashOut = action === UserAccountTransferAction.CashOut
  const isDeposit = action === UserAccountTransferAction.Deposit
  const isCollectiblePurchase =
    action === UserAccountTransferAction.CollectiblePurchase
  const isCollectibleSale = action === UserAccountTransferAction.CollectibleSale
  const isPackPurchase = action === UserAccountTransferAction.PackPurchase
  const isFailedWireRefund =
    wirePayout && wirePayout.status === CirclePayoutStatus.Failed
  const isReturnedWirePayout = wirePayout && wirePayout.return

  // Date status
  const sellDate = new Date(createdAt)
  const settlementDate = addDays(sellDate, 14)
  const hasSettled = isAfterDate(new Date(), settlementDate)
  // const hasSettled = true

  return (
    <li className={css.transferItem} key={createdAt}>
      <div className={css.transferContent}>
        <TransferIcon {...{ status, action, hasSettled }} />
        <div>
          <div className={css.transferTitle}>
            {status === CircleTransferStatus.Pending &&
              `${t('common:statuses.Pending')}: `}
            {status === CircleTransferStatus.Failed &&
              `${t('common:statuses.Failed')}: `}
            {isCashOut && (
              <>
                {t('common:statuses.Cashed out')}{' '}
                {wirePayout && wirePayout.destinationName && (
                  <small>{`(${wirePayout.destinationName})`}</small>
                )}
                <div className={css.transferAmount}>
                  <Credits parentheses value={Number(amount)} />
                </div>
              </>
            )}
            {isDeposit && (
              <>
                {!wirePayout && t('common:statuses.Added')}
                {isFailedWireRefund && t('common:statuses.Cash out refund')}
                {isReturnedWirePayout &&
                  t('common:statuses.Cash out return')}{' '}
                {wirePayout && wirePayout.destinationName && (
                  <small>{`(${wirePayout.destinationName})`}</small>
                )}
                <div className={css.transferAmount}>
                  <Credits parentheses value={Number(amount)} />
                </div>
              </>
            )}
            {isCollectiblePurchase && (
              <>
                {t('common:statuses.Bought Item', { name: collectible.title })}
                {status !== CircleTransferStatus.Failed && (
                  <div className={css.transferAmount}>
                    <Credits parentheses value={Number(amount)} />
                  </div>
                )}
              </>
            )}
            {isPackPurchase && (
              <>
                {t('common:statuses.Bought Item', { name: pack.title })}
                {status !== CircleTransferStatus.Failed && (
                  <div className={css.transferAmount}>
                    <Credits parentheses value={Number(amount)} />
                  </div>
                )}
              </>
            )}
            {isCollectibleSale && (
              <>
                {t('common:statuses.Sold Item', { name: collectible.title })}
                {status !== CircleTransferStatus.Failed && (
                  <div className={css.transferAmount}>
                    <Credits parentheses value={Number(amount)} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className={css.transferItemRight}>
        <div className={css.transferDate}>
          {new Date(createdAt).toLocaleString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {isCollectiblePurchase &&
            status === CircleTransferStatus.Complete &&
            !hasSettled && (
              <span>
                &nbsp; (
                {t('common:statuses.Tradeable on', {
                  date: new Date(settlementDate).toLocaleString(locale, {
                    month: 'long',
                    day: 'numeric',
                  }),
                })}
                )
              </span>
            )}
        </div>
      </div>
    </li>
  )
}
