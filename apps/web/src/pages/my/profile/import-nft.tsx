import { CollectibleListWithTotal } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useState } from 'react'

import { useImportCollectible } from '@/hooks/use-import-collectible'
import MyProfileLayout from '@/layouts/my-profile-layout'
import { AuthService } from '@/services/auth-service'
import MyImportNFTTemplate from '@/templates/my-import-nft-template'
import { useApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

export type TransferStage =
  | 'passphrase'
  | 'connect'
  | 'select-account'
  | 'select-asset'
  | 'transfer'
  | 'success'
  | 'error'

export default function MyImportPage() {
  const { t } = useTranslation()
  const [passphrase, setPassphrase] = useState('')
  const [stage, setStage] = useState<TransferStage>('passphrase')
  const importer = useImportCollectible(passphrase)
  const [assetId, setAssetId] = useState(0)
  const [error, setError] = useState('')
  const { data: collectibles } = useApi<CollectibleListWithTotal>(
    importer.selectedAccount
      ? `${urls.api.v1.getAssetsByAlgoAddress}?algoAddress=${importer.selectedAccount}&pageSize=-1`
      : null
  )

  const onPassphraseChange = useCallback(
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

  const onSelectAccount = useCallback(() => {
    setStage('select-asset')
  }, [])

  const onCancel = useCallback(async () => {
    setStage('passphrase')
    setPassphrase('')
    setAssetId(0)
    await importer.disconnect()
  }, [importer])

  const onTransfer = useCallback(async () => {
    try {
      setStage('transfer')
      await importer.importCollectible(Number(assetId))
      setStage('success')
    } catch (error) {
      // TODO: improve error message
      setError(error instanceof Error ? error.message : String(error))
      setStage('error')
      setAssetId(0)
      setPassphrase('')
      await importer.disconnect()
    }
  }, [assetId, importer])

  useEffect(() => {
    if (stage === 'connect' && importer.connected) {
      setStage('select-account')
    }
  }, [stage, importer.connected])

  return (
    <MyProfileLayout pageTitle={t('common:pageTitles.Import NFT')}>
      <MyImportNFTTemplate
        accounts={importer.accounts}
        error={error}
        importStatus={importer.importStatus}
        onCancel={onCancel}
        onConnectWallet={importer.connect}
        onPassphraseChange={onPassphraseChange}
        onSelectAccount={importer.selectAccount}
        onConfirmAccount={onSelectAccount}
        onTransfer={onTransfer}
        selectedAccount={importer.selectedAccount}
        stage={stage}
        assetId={assetId}
        collectibles={collectibles?.collectibles || []}
        onSetAssetId={setAssetId}
      />
    </MyProfileLayout>
  )
}
