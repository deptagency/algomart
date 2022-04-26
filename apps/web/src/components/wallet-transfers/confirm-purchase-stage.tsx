import { RadioGroup } from '@headlessui/react'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import LinkButton from '../link-button'

import css from './wallet-transfers.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { formatAlgoAddress } from '@/utils/format-string'
import { urls } from '@/utils/urls'

export interface ConfirmPurchaseStageProps {
  accounts: string[]
  confirmLabel: string
  image?: string
  onCancel: () => void
  onConfirm: () => void
  onSelectAccount: (account: string) => void
  selectedAccount: string
  selectedAccountBalance: number | null
  subtitle?: string
  title?: string
}

export default function ConfirmPurchaseStage({
  accounts,
  confirmLabel,
  image,
  onCancel,
  onConfirm,
  onSelectAccount,
  selectedAccount,
  selectedAccountBalance,
  subtitle,
  title,
}: ConfirmPurchaseStageProps) {
  const { t } = useTranslation()
  const size = 60
  const imageURL = image
    ? `${image}?fit=cover&height=${size}&width=${size}&quality=75`
    : null
  return (
    <div key="confirm-purchase" className={css.stageFull}>
      <Heading level={3} bold className={css.stageTitle}>
        {t('common:actions.Purchase')}
      </Heading>
      <hr className={css.separator} />
      <div className={css.purchaseDetails}>
        <div className={css.imageWrapper}>
          {imageURL && (
            <Image
              alt={title}
              className={css.image}
              layout="intrinsic"
              src={imageURL}
              height={size}
              width={size}
            />
          )}
        </div>
        <div>
          <Heading level={2} className={css.title}>
            {title}
          </Heading>
          {subtitle ? (
            <Heading level={4} className={css.subtitle}>
              {subtitle}
            </Heading>
          ) : null}
        </div>
        <div>
          {/* @TODO: Price in ALGOS */}
          <p className={css.algos}>{'0 ALGO'}</p>
          {/* @TODO: Price in user currency */}
          <p className={css.price}>{'0'}</p>
        </div>
      </div>
      <div>
        <hr className={css.separator} />
        <Heading level={3} bold className={clsx(css.stageTitle, css.alignLeft)}>
          {t('forms:sections.Wallet Balance')}
        </Heading>
        <RadioGroup value={selectedAccount} onChange={onSelectAccount}>
          <RadioGroup.Label hidden>
            {t('nft:walletConnect.destinationWallet')}
          </RadioGroup.Label>
          {accounts.map((account) => (
            <RadioGroup.Option key={account} value={account}>
              {({ checked }) => (
                <div className={css.accountItem}>
                  <span
                    className={clsx(
                      css.accountItemRadio,
                      checked && css.accountItemRadioChecked,
                      !checked && css.accountItemRadioUnchecked
                    )}
                  >
                    {checked ? (
                      <span className={css.accountItemRadioCheckedInner}></span>
                    ) : null}
                  </span>
                  <span>{formatAlgoAddress(account)}</span>
                </div>
              )}
            </RadioGroup.Option>
          ))}
        </RadioGroup>
        {selectedAccountBalance && (
          <div className={css.balance}>
            <p>
              {t('nft:walletConnect.algoPrice', {
                price: selectedAccountBalance,
              })}
            </p>
          </div>
        )}
      </div>
      <div>
        <Heading level={3} bold className={clsx(css.stageTitle, css.alignLeft)}>
          {t('forms:sections.Summary')}
        </Heading>
        <hr className={css.separator} />
      </div>
      <div className={css.summaryWrapper}>
        <table className={css.paymentGrid}>
          <tbody>
            <tr>
              <th scope="col">{t('common:global.Total')}</th>
              {/* @TODO: Total price in ALGOS */}
              <td scope="col" className={css.total}>
                {'0 ALGO'}
              </td>
            </tr>
            <tr>
              <th scope="col">{t('nft:walletConnect.Item Price')}</th>
              {/* @TODO: Item price in ALGOS */}
              <td scope="col">{'0 ALGO'}</td>
            </tr>
            <tr>
              <th scope="col">
                {t('nft:walletConnect.creatorFee', { percentage: '10%' })}
              </th>
              {/* @TODO: 10% creator fee */}
              <td scope="col">{'0 ALGO'}</td>
            </tr>
          </tbody>
        </table>
        <p className={css.helpText}>
          {t('nft:walletConnect.fineprint.helpText')}
        </p>
        {/* @TODO: Update link when we have an informational page */}
        <LinkButton
          href={urls.home}
          variant="tertiary"
          size="small"
          className={css.link}
          fullWidth
        >
          {t('nft:walletConnect.fineprint.linkText')}
        </LinkButton>
      </div>
      <hr className={css.separator} />
      <div className={css.spacing}>
        <Button fullWidth onClick={onConfirm} disabled={!selectedAccount}>
          {confirmLabel}
        </Button>
      </div>
      <div className={css.spacing}>
        <Button
          onClick={onCancel}
          size="small"
          variant="link"
          fullWidth
          className={css.buttonLink}
        >
          {t('nft:walletConnect.orCancel')}
        </Button>
      </div>
    </div>
  )
}
