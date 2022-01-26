import { CollectibleWithDetails } from '@algomart/schemas'
import { RadioGroup } from '@headlessui/react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/outline'
import clsx from 'clsx'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { Fragment, useCallback, useEffect, useState } from 'react'

import { ApiClient } from '@/clients/api-client'
import Button from '@/components/button'
import Heading from '@/components/heading'
import LinkButton from '@/components/link-button'
import Loading from '@/components/loading/loading'
import PassphraseInput from '@/components/passphrase-input/passphrase-input'
import CardPurchaseHeader from '@/components/purchase-form/cards/sections/card-header'
import { useExportCollectible } from '@/hooks/use-export-collectible'
import DefaultLayout from '@/layouts/default-layout'
import { formatAlgoAddress } from '@/utils/format-string'

export default function TransferPage({
  collectible,
}: {
  collectible: CollectibleWithDetails
}) {
  const [passphrase, setPassphrase] = useState('')
  const {
    connect,
    connected,
    accounts,
    selectAccount,
    selectedAccount,
    hasOptedIn,
    disconnect,
    exportCollectible,
  } = useExportCollectible(passphrase)
  const [error, setError] = useState('')
  const [stage, setStage] = useState<
    | 'passphrase'
    | 'connect'
    | 'select-account'
    | 'transfer'
    | 'success'
    | 'error'
  >('passphrase')
  const router = useRouter()

  const handlePassphraseChange = useCallback((passphrase: string) => {
    if (passphrase.length < 6) return
    setPassphrase(passphrase)
    setStage('connect')
    // TODO: verify passphrase is correct
  }, [])

  const cancel = useCallback(async () => {
    await disconnect()
    router.push(`/nft/${collectible.templateId}/${collectible.address}`)
  }, [collectible.address, collectible.templateId, disconnect, router])

  const transfer = useCallback(async () => {
    try {
      setStage('transfer')
      await exportCollectible(collectible.address)
      setStage('success')
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
      setStage('error')
    }
  }, [collectible.address, exportCollectible])

  useEffect(() => {
    if (stage === 'connect' && connected) {
      setStage('select-account')
    }
  }, [stage, connected])

  return (
    <DefaultLayout panelPadding pageTitle={collectible.title}>
      <div className="flex flex-col items-center justify-start h-full px-8">
        <CardPurchaseHeader
          image={collectible.image}
          title={collectible.title}
          subtitle={collectible.collection?.name}
        />

        {stage === 'passphrase' ? (
          <div key="passphrase" className="w-full max-w-xs mx-auto text-center">
            <h2 className="pb-5 text-lg font-semibold leading-none">
              PIN Code
            </h2>
            <hr className="pb-5 border-t-base-gray-medium" />
            <PassphraseInput handleChange={handlePassphraseChange} />
            <div className="px-6 pt-5 text-base-gray-medium">
              Enter your PIN Code to authorize this transaction.
            </div>
          </div>
        ) : null}

        {stage === 'connect' ? (
          <div key="connect" className="w-full max-w-xs mx-auto text-center">
            <h2 className="pb-5 text-lg font-semibold leading-none">
              Algorand WalletConnect
            </h2>
            <hr className="pb-5 border-t-base-gray-medium" />
            <Button fullWidth onClick={connect}>
              Open WalletConnect
            </Button>
            <div className="px-6 pt-5 text-base-gray-medium">
              Use WalletConnect to link your Algorand wallet to AlgoMart.
              <br />
              <br />
              Need a wallet? Get one here:
              <br />
              <a
                href="https://algorandwallet.com"
                target="_blank"
                rel="noreferrer nofollow"
                className="underline"
              >
                algorandwallet.com
              </a>
            </div>
          </div>
        ) : null}

        {stage === 'select-account' ? (
          <div
            key="select-account"
            className="w-full max-w-xs mx-auto text-center"
          >
            <h2 className="pb-5 text-lg font-semibold leading-none">
              Destination wallet:
            </h2>
            <hr className="pb-5 border-t-base-gray-medium" />
            <RadioGroup value={selectedAccount} onChange={selectAccount}>
              <RadioGroup.Label hidden>Account</RadioGroup.Label>
              {accounts.map((account) => (
                <RadioGroup.Option key={account} value={account}>
                  {({ checked }) => (
                    <div className="flex flex-row items-center p-5 mb-5 rounded shadow-md cursor-pointer bg-base-bgCard">
                      <span
                        className={clsx(
                          'flex items-center justify-center w-6 h-6 mr-5 border-2 rounded-full',
                          checked && 'border-base-textPrimary',
                          !checked && 'border-base-gray-medium'
                        )}
                      >
                        {checked ? (
                          <span className="inline-block w-3 h-3 rounded-full bg-base-textPrimary "></span>
                        ) : null}
                      </span>
                      <span>{formatAlgoAddress(account)}</span>
                    </div>
                  )}
                </RadioGroup.Option>
              ))}
            </RadioGroup>
            <div className="pt-5">
              <Button fullWidth onClick={transfer} disabled={!selectedAccount}>
                Transfer
              </Button>
            </div>
            <div className="pt-5">
              <Button
                onClick={cancel}
                size="small"
                variant="link"
                fullWidth
                className="text-sm underline text-base-gray-medium"
              >
                or cancel and disconnect from wallet
              </Button>
            </div>
          </div>
        ) : null}

        {stage === 'transfer' ? (
          <div key="transfer">
            <Loading loadingText="Transferring NFT..." />
          </div>
        ) : null}

        {stage === 'success' ? (
          <div key="success" className="w-full max-w-xs mx-auto text-center">
            <div className="flex flex-col items-center">
              <span className="text-base-price">
                <CheckCircleIcon width={48} />
              </span>
              <Heading bold level={2} size={1} className="mt-5 mb-7">
                Sent!
              </Heading>
              <LinkButton fullWidth href="/my/collectibles">
                Back to My Collection
              </LinkButton>
            </div>
          </div>
        ) : null}

        {stage === 'error' ? (
          <div key="error" className="w-full max-w-xs mx-auto text-center">
            <div className="flex flex-col items-center">
              <span className="text-base-error">
                <ExclamationCircleIcon width={48} />
              </span>
              <Heading bold level={2} size={1} className="mt-5 mb-7">
                {error}
              </Heading>
              <LinkButton fullWidth href="/my/collectibles">
                Back to My Collection
              </LinkButton>
            </div>
          </div>
        ) : null}
      </div>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { templateId, assetId } = context.query
  const collectible = await ApiClient.instance.getCollectible({
    templateId: templateId as string,
    assetId: Number(assetId),
  })
  return {
    props: {
      collectible,
    },
  }
}
