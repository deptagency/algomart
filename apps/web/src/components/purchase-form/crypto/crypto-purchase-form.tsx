import { PackType } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { FormEvent, useCallback, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import CryptoForm from './sections/crypto-form'
import CryptoHeader from './sections/crypto-header'
import CryptoSuccess from './sections/crypto-success'

import css from './crypto-purchase-form.module.css'

import { ApiClient } from '@/clients/api-client'
import Loading from '@/components/loading/loading'
import { PaymentContextProps } from '@/contexts/payment-context'
import { useUntransferredPacks } from '@/hooks/use-untransferred-packs'
import { AlgorandAdapter, ChainType, IConnector } from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'
import { isAfterNow } from '@/utils/date-time'
import { formatToDecimal } from '@/utils/format-currency'
import { urls } from '@/utils/urls'

const algorand = new AlgorandAdapter(ChainType.TestNet)

export interface CryptoPurchaseFormProps {
  address?: string
  addressTag?: string
}

export default function CryptoPurchaseForm({
  address,
  addressTag,
  bid,
  currentBid,
  handleSubmitBid: onSubmitBid,
  loadingText,
  price,
  release,
  setBid,
  setStatus,
  status,
}: PaymentContextProps & CryptoPurchaseFormProps) {
  const isAuctionActive =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<string>('')
  console.log('account:', account)
  const connectorReference = useRef<IConnector>()
  const { data: untransferred } = useUntransferredPacks()

  console.log(untransferred)

  const connect = useCallback(async () => {
    setConnected(false)

    const connector = (connectorReference.current = new WalletConnectAdapter(
      algorand
    ))

    connector.subscribe('update_accounts', (accounts: string[]) => {
      setAccount(accounts[0])
      setConnected(true)
    })

    await connector.connect()
  }, [])

  const disconnect = useCallback(async () => {
    const connector = connectorReference.current
    if (connector) {
      await connector.disconnect()
      setConnected(false)
      setAccount('')
    }
  }, [])

  const purchase = useCallback(async () => {
    // console.log('account:', account)
    const assetData = await algorand.getAssetData(account)
    // console.log('assetData:', assetData)
    // Confirm account has enough funds
    const usdcAsset = assetData.find((asset) => asset.unitName === 'USDC')
    console.log('usdcAsset:', usdcAsset)
    if (!usdcAsset) return null
    const usdcBalance = formatToDecimal(usdcAsset.amount, usdcAsset.decimals)
    console.log('usdcBalance:', usdcBalance)
    console.log('price:', price)
    // const connector = connectorReference.current
    // if (connector) {
    //   const amount = price + 1000
    //   const paymentTx = await algorand.makePaymentTransaction({
    //     // initial balance plus non-participation transaction fee
    //     amount,
    //     from: account,
    //     to: address,
    //     closeRemainderTo: address,
    //     note: undefined,
    //     rekeyTo: undefined,
    //   })
    //   await connector.signTransaction(paymentTx)
    // }
  }, [account, address, addressTag, price])

  const handleSubmitPurchase = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      await (release?.type === PackType.Auction && isAuctionActive
        ? onSubmitBid(data, 'crypto')
        : purchase())
    },
    [release?.type, isAuctionActive, onSubmitBid, purchase]
  )

  const handleRetry = useCallback(() => {
    setStatus('form')
  }, [setStatus])

  return (
    <section className={css.root}>
      <CryptoHeader release={release} />

      {status === 'form' && (
        <CryptoForm
          account={account}
          bid={bid}
          className={status === 'form' ? 'w-full' : 'hidden'}
          connect={connect}
          connected={connected}
          currentBid={currentBid || null}
          disconnect={disconnect}
          handleSubmitPurchase={handleSubmitPurchase}
          isAuctionActive={isAuctionActive}
          price={price}
          release={release}
          setBid={setBid}
        />
      )}

      {status === 'loading' && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === 'success' && <CryptoSuccess release={release} />}
    </section>
  )
}

export const getServerSideProps: GetServerSideProps<
  CryptoPurchaseFormProps
> = async () => {
  // Generate blockchain address
  const address = await ApiClient.instance.createWalletAddress({
    idempotencyKey: uuid(),
  })
  console.log('address', address)

  if (address) {
    return {
      props: {
        address: address.address,
        addressTag: address.addressTag,
      },
    }
  }

  return {
    redirect: {
      destination: urls.home,
      permanent: false,
    },
  }
}
