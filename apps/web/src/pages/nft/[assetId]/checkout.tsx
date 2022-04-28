import { CollectibleWithDetails } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import { ApiClient } from '@/clients/api-client'
import { usePurchaseCollectible } from '@/hooks/use-purchase-collectible'
import DefaultLayout from '@/layouts/default-layout'
import { AuthService } from '@/services/auth-service'
import NFTCheckoutTemplate, {
  CheckoutStage,
} from '@/templates/nft-checkout-template'
import { urls } from '@/utils/urls'

export default function CheckoutPage({
  address,
  collectible,
}: {
  address: string | null
  collectible: CollectibleWithDetails
}) {
  const { t } = useTranslation()
  const [passphrase, setPassphrase] = useState('')
  const {
    accounts,
    connect,
    connected,
    disconnect,
    purchaseCollectible,
    purchaseStatus,
    selectAccount,
    selectedAccount,
    selectedAccountBalance,
  } = usePurchaseCollectible(passphrase)
  const [error, setError] = useState('')
  const [stage, setStage] = useState<CheckoutStage>('passphrase')
  const router = useRouter()

  const handlePassphraseChange = useCallback(
    async (passphrase: string) => {
      if (passphrase.length < 6) return
      if (await AuthService.instance.verifyPassphrase(passphrase)) {
        setPassphrase(passphrase)
        setStage('connect')
      } else {
        setError(t('forms:errors.invalidPassphrase'))
        setStage('error')
      }
    },
    [t]
  )

  const cancel = useCallback(async () => {
    await disconnect()
    router.push(urls.nft.replace(':assetId', String(collectible.address)))
  }, [collectible.address, disconnect, router])

  const purchase = useCallback(async () => {
    try {
      setStage('purchase')
      // @TODO: Pass in the seller's address instead
      await purchaseCollectible(address, t('nft:walletConnect.txnMessage'))
      setStage('success')
    } catch (error) {
      // @TODO: improve error message
      setError(error instanceof Error ? error.message : String(error))
      setStage('error')
    }
  }, [address, purchaseCollectible, t])

  return (
    <DefaultLayout panelPadding pageTitle={collectible.title}>
      <NFTCheckoutTemplate
        accounts={accounts}
        selectedAccount={selectedAccount}
        selectedAccountBalance={selectedAccountBalance}
        collectible={collectible}
        connected={connected}
        error={error}
        onCancel={cancel}
        onConnectWallet={connect}
        onPassphraseChange={handlePassphraseChange}
        onSelectAccount={selectAccount}
        onPurchase={purchase}
        stage={stage}
        purchaseStatus={purchaseStatus}
      />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { assetId } = context.query
  const collectible = await ApiClient.instance.getCollectible({
    assetId: Number(assetId),
  })

  // @TODO: Remove when we change to use the seller's address
  const address = await ApiClient.instance
    .createWalletAddress()
    .catch(() => null)

  return {
    props: {
      address: address?.address || null,
      collectible,
    },
  }
}
