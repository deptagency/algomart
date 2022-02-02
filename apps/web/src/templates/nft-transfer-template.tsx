import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from '@/components/wallet-transfers/wallet-transfers.module.css'

import CardPurchaseHeader from '@/components/purchase-form/cards/sections/card-header'
import ConnectWalletStage from '@/components/wallet-transfers/connect-wallet-stage'
import ErrorStage from '@/components/wallet-transfers/error-stage'
import LoadingStage from '@/components/wallet-transfers/loading-stage'
import PassphraseStage from '@/components/wallet-transfers/passphrase-stage'
import SelectAccountStage from '@/components/wallet-transfers/select-account-stage'
import SuccessStage from '@/components/wallet-transfers/success-stage'
import { ExportStatus } from '@/hooks/use-export-collectible'
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
        <PassphraseStage key={stage} onPassphraseChange={onPassphraseChange} />
      ) : null}

      {stage === 'connect' ? (
        <ConnectWalletStage key={stage} onConnectWallet={onConnectWallet} />
      ) : null}

      {stage === 'select-account' ? (
        <SelectAccountStage
          key={stage}
          accounts={accounts}
          onCancel={onCancel}
          onSelectAccount={onSelectAccount}
          onConfirm={onTransfer}
          selectedAccount={selectedAccount}
          confirmLabel={t('nft:walletConnect.transfer')}
        />
      ) : null}

      {stage === 'transfer' ? (
        <LoadingStage key={stage} message={exportStatusMessage} />
      ) : null}

      {stage === 'success' ? (
        <SuccessStage
          key={stage}
          linkText={t('nft:walletConnect.backToMyCollection')}
          linkUrl={urls.myCollectibles}
        />
      ) : null}

      {stage === 'error' ? (
        <ErrorStage
          key={stage}
          error={error}
          linkText={t('nft:walletConnect.backToMyCollection')}
          linkUrl={urls.myCollectibles}
        />
      ) : null}
    </div>
  )
}
