import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from '@/components/wallet-transfers/wallet-transfers.module.css'

import CardPurchaseHeader from '@/components/purchase-form/cards/sections/card-header'
import ConfirmPurchaseStage from '@/components/wallet-transfers/confirm-purchase-stage'
import ConnectWalletStage from '@/components/wallet-transfers/connect-wallet-stage'
import ErrorStage from '@/components/wallet-transfers/error-stage'
import LoadingStage from '@/components/wallet-transfers/loading-stage'
import PassphraseStage from '@/components/wallet-transfers/passphrase-stage'
import SuccessStage from '@/components/wallet-transfers/success-stage'
import { PurchaseStatus } from '@/hooks/use-purchase-collectible'
import { urls } from '@/utils/urls'

export type CheckoutStage =
  | 'passphrase'
  | 'connect'
  | 'confirm-purchase'
  | 'purchase'
  | 'success'
  | 'error'

export interface NFTCheckoutTemplateProps {
  accounts: string[]
  collectible: CollectibleWithDetails
  error: string
  onCancel: () => void
  onConnectWallet: () => void
  onPassphraseChange: (passphrase: string) => void
  onSelectAccount: (account: string) => void
  onTransfer: () => void
  purchaseStatus: PurchaseStatus
  selectedAccount: string
  selectedAccountBalance: number | null
  stage: CheckoutStage
}

export default function NFTCheckoutTemplate({
  accounts,
  collectible,
  error,
  purchaseStatus,
  onCancel,
  onConnectWallet,
  onPassphraseChange,
  onSelectAccount,
  onTransfer,
  selectedAccount,
  selectedAccountBalance,
  stage,
}: NFTCheckoutTemplateProps) {
  const { t } = useTranslation()
  const exportStatusMessage = {
    idle: t('nft:exportStatus.idle'),
    'generating-transactions': t('nft:exportStatus.generatingTransactions'),
    'sign-transaction': t('nft:exportStatus.optingIn'),
    pending: t('nft:exportStatus.pending'),
    success: t('nft:exportStatus.success'),
    error: t('nft:exportStatus.error'),
  }[purchaseStatus]

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

      {stage === 'confirm-purchase' ? (
        <>
          <ConfirmPurchaseStage
            confirmLabel={t('common:actions.Confirm Purchase')}
            image={collectible.image}
            key={stage}
            accounts={accounts}
            onCancel={onCancel}
            onSelectAccount={onSelectAccount}
            onConfirm={onTransfer}
            selectedAccount={selectedAccount}
            selectedAccountBalance={selectedAccountBalance}
            subtitle={collectible.collection?.name}
            title={collectible.title}
          />
        </>
      ) : null}

      {stage === 'purchase' ? (
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
