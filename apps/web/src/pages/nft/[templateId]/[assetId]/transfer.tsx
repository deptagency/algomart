import { CollectibleWithDetails } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useState } from 'react'

import { ApiClient } from '@/clients/api-client'
import { useExportCollectible } from '@/hooks/use-export-collectible'
import DefaultLayout from '@/layouts/default-layout'
import authService from '@/services/auth-service'
import NFTTransferTemplate from '@/templates/nft-transfer-template'

export default function TransferPage({
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

  const handlePassphraseChange = useCallback(
    async (passphrase: string) => {
      if (passphrase.length < 6) return
      if (await authService.verifyPassphrase(passphrase)) {
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
    router.push(`/nft/${collectible.templateId}/${collectible.address}`)
  }, [collectible.address, collectible.templateId, disconnect, router])

  const transfer = useCallback(async () => {
    try {
      setStage('transfer')
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
      <NFTTransferTemplate
        accounts={accounts}
        selectedAccount={selectedAccount}
        collectible={collectible}
        error={error}
        onCancel={cancel}
        onPassphraseChange={handlePassphraseChange}
        onSelectAccount={selectAccount}
        onConnectWallet={connect}
        onTransfer={transfer}
        stage={stage}
      />
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
