import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from '@/components/wallet-transfers/wallet-transfers.module.css'

import CardPurchaseHeader from '@/components/purchase-form/cards/sections/card-header'
import ConnectWalletStage from '@/components/wallet-transfers/connect-wallet-stage'
import ErrorStage from '@/components/wallet-transfers/error-stage'
import LoadingStage from '@/components/wallet-transfers/loading-stage'
import PassphraseStage from '@/components/wallet-transfers/passphrase-stage'
import SellListDetailsStage from '@/components/wallet-transfers/sell-list-details-stage'
import SuccessStage from '@/components/wallet-transfers/success-stage'
import { ListStatus } from '@/hooks/use-list-collectible'
import { urls } from '@/utils/urls'

export type ListStage =
  | 'passphrase'
  | 'connect'
  | 'select-account'
  | 'list'
  | 'success'
  | 'error'

export interface NFTListingTemplateProps {
  collectible: CollectibleWithDetails
  onPassphraseChange: (passphrase: string) => void
  onCancel: () => void
  onList: () => void
  onSelectAccount: (account: string) => void
  onConnectWallet: () => void
  error: string
  accounts: string[]
  selectedAccount: string
  listStatus: ListStatus
  stage: ListStage
}

export default function NFTListingTemplate({
  stage,
  onConnectWallet,
  collectible,
  error,
  onPassphraseChange,
  onCancel,
  onTransfer,
  listStatus,
}: NFTListingTemplateProps) {
  const { t } = useTranslation()
  const listStatusMessage = {
    idle: t('nft:listStatus.idle'),
    'generating-transactions': t('nft:listStatus.generatingTransactions'),
    'sign-transaction': t('nft:listStatus.optingIn'),
    pending: t('nft:listStatus.pending'),
    success: t('nft:listStatus.success'),
    error: t('nft:listStatus.error'),
  }[listStatus]

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
        <SellListDetailsStage
          key={stage}
          onCancel={onCancel}
          onConfirm={onTransfer}
          confirmLabel={t('nft:walletConnect.list')}
        />
      ) : null}

      {stage === 'list' ? (
        <LoadingStage key={stage} message={listStatusMessage} />
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
