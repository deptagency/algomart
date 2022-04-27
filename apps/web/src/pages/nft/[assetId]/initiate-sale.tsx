import { CollectibleWithDetails } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useState } from 'react'

import { ApiClient } from '@/clients/api-client'
import { useExportCollectible } from '@/hooks/use-export-collectible'
import DefaultLayout from '@/layouts/default-layout'
import { AuthService } from '@/services/auth-service'
import NFTListingTemplate, { ListStage } from '@/templates/nft-listing-template'
import { urls } from '@/utils/urls'

export default function SalePage({
  collectible,
}: {
  collectible: CollectibleWithDetails
}) {
  const { t } = useTranslation()
  const [passphrase, setPassphrase] = useState('')
  const {
    connect,
    connected,
    accounts,
    selectAccount,
    selectedAccount,
    disconnect,
    exportCollectible,
    exportStatus,
  } = useExportCollectible(passphrase)
  const [error, setError] = useState('')
  const [stage, setStage] = useState<ListStage>('passphrase')
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

  const list = useCallback(async () => {
    try {
      setStage('list')
      await exportCollectible(collectible.address)
      setStage('success')
    } catch (error) {
      // TODO: improve error message
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
      <NFTListingTemplate
        accounts={accounts}
        selectedAccount={selectedAccount}
        collectible={collectible}
        error={error}
        onCancel={cancel}
        onPassphraseChange={handlePassphraseChange}
        onSelectAccount={selectAccount}
        onConnectWallet={connect}
        onList={list}
        stage={stage}
        listStatus={exportStatus}
      />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { assetId } = context.query
  const collectible = await ApiClient.instance.getCollectible({
    assetId: Number(assetId),
  })
  return {
    props: {
      collectible,
    },
  }
}
