import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import ConnectWalletStage from '@/components/wallet-transfers/connect-wallet-stage'
import ErrorStage from '@/components/wallet-transfers/error-stage'
import LoadingStage from '@/components/wallet-transfers/loading-stage'
import PassphraseStage from '@/components/wallet-transfers/passphrase-stage'
import SelectAccountStage from '@/components/wallet-transfers/select-account-stage'
import SelectAssetStage from '@/components/wallet-transfers/select-asset-stage'
import SuccessStage from '@/components/wallet-transfers/success-stage'
import { ImportStatus } from '@/hooks/use-import-collectible'
import { urls } from '@/utils/urls'

export type TransferStage =
  | 'passphrase'
  | 'connect'
  | 'select-account'
  | 'select-asset'
  | 'transfer'
  | 'success'
  | 'error'

export interface MyImportNFTTemplateProps {
  onPassphraseChange: (passphrase: string) => void
  onCancel: () => void
  onTransfer: () => void
  onSelectAccount: (account: string) => void
  onConnectWallet: () => void
  onConfirmAccount: () => void
  onSetAssetId: (assetId: number) => void
  error: string
  accounts: string[]
  selectedAccount: string
  importStatus: ImportStatus
  stage: TransferStage
  assetId: number
  collectibles: CollectibleWithDetails[]
}

export default function MyImportNFTTemplate({
  accounts,
  error,
  importStatus,
  onPassphraseChange,
  onCancel,
  onTransfer,
  onConnectWallet,
  onSelectAccount,
  onConfirmAccount,
  selectedAccount,
  stage,
  assetId,
  onSetAssetId,
  collectibles,
}: MyImportNFTTemplateProps) {
  const { t } = useTranslation()

  const importStatusMessage = {
    idle: t('nft:exportStatus.idle'),
    'generating-transactions': t('nft:exportStatus.generatingTransactions'),
    'sign-transaction': t('nft:exportStatus.signTransaction'),
    pending: t('nft:exportStatus.pending'),
    success: t('nft:exportStatus.success'),
    error: t('nft:exportStatus.error'),
  }[importStatus]

  return (
    <div>
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
          confirmLabel={t('nft:walletConnect.selectAccount')}
          onCancel={onCancel}
          onConfirm={onConfirmAccount}
          onSelectAccount={onSelectAccount}
          selectedAccount={selectedAccount}
        />
      ) : null}

      {stage === 'select-asset' ? (
        <SelectAssetStage
          key={stage}
          assetId={assetId}
          collectibles={collectibles}
          onCancel={onCancel}
          onConfirm={onTransfer}
          setAssetId={onSetAssetId}
        />
      ) : null}

      {stage === 'transfer' ? (
        <LoadingStage key={stage} message={importStatusMessage} />
      ) : null}

      {stage === 'success' ? (
        <SuccessStage
          key={stage}
          linkText={t('nft:walletConnect.backToMyImport')}
          linkUrl={urls.myProfileImportNFT}
        />
      ) : null}

      {stage === 'error' ? (
        <ErrorStage
          key={stage}
          error={error}
          linkText={t('nft:walletConnect.backToMyImport')}
          linkUrl={urls.myProfileImportNFT}
        />
      ) : null}
    </div>
  )
}
