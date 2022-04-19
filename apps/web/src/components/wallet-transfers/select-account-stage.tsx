import { RadioGroup } from '@headlessui/react'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './wallet-transfers.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { formatAlgoAddress } from '@/utils/format-string'

export interface SelectAccountStageProps {
  accounts: string[]
  selectedAccount: string
  onSelectAccount: (account: string) => void
  onConfirm: () => void
  onCancel: () => void
  confirmLabel: string
}

export default function SelectAccountStage(props: SelectAccountStageProps) {
  const { t } = useTranslation()
  return (
    <div key="select-account" className={css.stage}>
      <Heading level={3} bold className={css.stageTitle}>
        {t('nft:walletConnect.destinationWallet')}
      </Heading>
      <hr className={css.separator} />
      <RadioGroup
        value={props.selectedAccount}
        onChange={props.onSelectAccount}
      >
        <RadioGroup.Label hidden>
          {t('nft:walletConnect.destinationWallet')}
        </RadioGroup.Label>
        {props.accounts.map((account) => (
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
      <div className={css.spacing}>
        <Button
          fullWidth
          onClick={props.onConfirm}
          disabled={!props.selectedAccount}
        >
          {props.confirmLabel}
        </Button>
      </div>
      <div className={css.spacing}>
        <Button
          onClick={props.onCancel}
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
