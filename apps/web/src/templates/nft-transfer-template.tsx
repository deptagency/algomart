import { CollectibleWithDetails } from '@algomart/schemas'
import { RadioGroup } from '@headlessui/react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/outline'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './nft-transfer-template.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import LinkButton from '@/components/link-button'
import Loading from '@/components/loading/loading'
import PassphraseInput from '@/components/passphrase-input/passphrase-input'
import CardPurchaseHeader from '@/components/purchase-form/cards/sections/card-header'
import { ExportStatus } from '@/hooks/use-export-collectible'
import { formatAlgoAddress } from '@/utils/format-string'
import { urls } from '@/utils/urls'

export type TransferStage =
  | 'passphrase'
  | 'connect'
  | 'select-account'
  | 'transfer'
  | 'success'
  | 'error'

export interface NFTTransferTemplateProps {
  collectible: CollectibleWithDetails
  onPassphraseChange: (passphrase: string) => void
  onCancel: () => void
  onTransfer: () => void
  onSelectAccount: (account: string) => void
  onConnectWallet: () => void
  error: string
  accounts: string[]
  selectedAccount: string
  exportStatus: ExportStatus
  stage: TransferStage
}

const ALGORAND_WALLET_LINK = {
  url: 'https://algorandwallet.com',
  text: 'algorandwallet.com',
}

export default function NFTTransferTemplate({
  stage,
  onConnectWallet,
  collectible,
  error,
  onPassphraseChange,
  onCancel,
  onTransfer,
  accounts,
  onSelectAccount,
  selectedAccount,
  exportStatus,
}: NFTTransferTemplateProps) {
  const { t } = useTranslation()
  const exportStatusMessage = {
    idle: t('nft:exportStatus.idle'),
    'opt-in': t('nft:exportStatus.optIn'),
    'opting-in': t('nft:exportStatus.optingIn'),
    pending: t('nft:exportStatus.pending'),
    success: t('nft:exportStatus.success'),
    error: t('nft:exportStatus.error'),
  }[exportStatus]

  return (
    <div className={css.root}>
      <CardPurchaseHeader
        image={collectible.image}
        title={collectible.title}
        subtitle={collectible.collection?.name}
      />

      {stage === 'passphrase' ? (
        <div key="passphrase" className={css.stage}>
          <Heading level={3} bold className={css.stageTitle}>
            {t('forms:fields.passphrase.label')}
          </Heading>
          <hr className={css.separator} />
          <PassphraseInput handleChange={onPassphraseChange} />
          <div className={css.stageHelp}>
            {t('forms:fields.passphrase.enterPassphrase')}
          </div>
        </div>
      ) : null}

      {stage === 'connect' ? (
        <div key="connect" className={css.stage}>
          <Heading level={3} bold className={css.stageTitle}>
            {t('nft:walletConnect.title')}
          </Heading>
          <hr className={css.separator} />
          <Button fullWidth onClick={onConnectWallet}>
            {t('nft:walletConnect.connect')}
          </Button>
          <div className={css.stageHelp}>
            {t('nft:walletConnect.description')}
            <br />
            <br />
            {t('nft:walletConnect.helpText')}
            <br />
            <a
              href={ALGORAND_WALLET_LINK.url}
              target="_blank"
              rel="noreferrer nofollow"
              className={css.link}
            >
              {ALGORAND_WALLET_LINK.text}
            </a>
          </div>
        </div>
      ) : null}

      {stage === 'select-account' ? (
        <div key="select-account" className={css.stage}>
          <Heading level={3} bold className={css.stageTitle}>
            {t('nft:walletConnect.selectAccount')}
          </Heading>
          <hr className={css.separator} />
          <RadioGroup value={selectedAccount} onChange={onSelectAccount}>
            <RadioGroup.Label hidden>
              {t('nft:walletConnect.selectAccount')}
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
                        <span
                          className={css.accountItemRadioCheckedInner}
                        ></span>
                      ) : null}
                    </span>
                    <span>{formatAlgoAddress(account)}</span>
                  </div>
                )}
              </RadioGroup.Option>
            ))}
          </RadioGroup>
          <div className={css.spacing}>
            <Button fullWidth onClick={onTransfer} disabled={!selectedAccount}>
              {t('nft:walletConnect.transfer')}
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
      ) : null}

      {stage === 'transfer' ? (
        <div key="transfer">
          <Loading loadingText={exportStatusMessage} />
        </div>
      ) : null}

      {stage === 'success' ? (
        <div key="success" className={css.stage}>
          <div className={css.terminalStage}>
            <span className={css.success}>
              <CheckCircleIcon width={48} />
            </span>
            <Heading bold level={2} size={1} className={css.terminalStageTitle}>
              {t('nft:walletConnect.sent')}
            </Heading>
            <LinkButton fullWidth href={urls.myCollectibles}>
              {t('nft:walletConnect.backToMyCollection')}
            </LinkButton>
          </div>
        </div>
      ) : null}

      {stage === 'error' ? (
        <div key="error" className={css.stage}>
          <div className={css.terminalStage}>
            <span className={css.error}>
              <ExclamationCircleIcon width={48} />
            </span>
            <Heading bold level={2} size={1} className={css.terminalStageTitle}>
              {error}
            </Heading>
            <LinkButton fullWidth href={urls.myCollectibles}>
              {t('nft:walletConnect.backToMyCollection')}
            </LinkButton>
          </div>
        </div>
      ) : null}
    </div>
  )
}
