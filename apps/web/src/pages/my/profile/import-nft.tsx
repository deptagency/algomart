import { CollectibleListWithTotal } from '@algomart/schemas'
import { RadioGroup } from '@headlessui/react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/outline'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useState } from 'react'

import css from '../../../templates/nft-transfer-template.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import LinkButton from '@/components/link-button'
import Loading from '@/components/loading/loading'
import PassphraseInput from '@/components/passphrase-input/passphrase-input'
import { useImportCollectible } from '@/hooks/use-import-collectible'
import MyProfileLayout from '@/layouts/my-profile-layout'
import collectibleService from '@/services/collectible-service'
import { formatAlgoAddress } from '@/utils/format-string'
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

const ALGORAND_WALLET_LINK = {
  url: 'https://algorandwallet.com',
  text: 'algorandwallet.com',
}

export default function MyImportPage() {
  const { t } = useTranslation()
  const [passphrase, setPassphrase] = useState('')
  const [stage, setStage] = useState<TransferStage>('passphrase')
  const importer = useImportCollectible(passphrase)
  const [assetId, setAssetId] = useState('')
  const [error, setError] = useState('')
  const { data: collectibles } = useApi<CollectibleListWithTotal>(
    importer.selectedAccount
      ? `${urls.api.v1.getAssetsByAlgoAddress}?algoAddress=${importer.selectedAccount}&pageSize=-1`
      : null
  )
  const importStatusMessage = {
    idle: t('nft:exportStatus.idle'),
    'generating-transactions': t('nft:exportStatus.generatingTransactions'),
    'sign-transaction': t('nft:exportStatus.signTransaction'),
    pending: t('nft:exportStatus.pending'),
    success: t('nft:exportStatus.success'),
    error: t('nft:exportStatus.error'),
  }[importer.importStatus]

  const onConnectWallet = importer.connect
  const onPassphraseChange = useCallback((passphrase: string) => {
    setPassphrase(passphrase)

    if (passphrase.length === 6) {
      setStage('connect')
    }
  }, [])
  const onSelectAccount = useCallback(async () => {
    setStage('select-asset')
  }, [])
  const onCancel = useCallback(async () => {
    setStage('passphrase')
    setPassphrase('')
    setAssetId('')
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
      setAssetId('')
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
      {stage === 'passphrase' ? (
        <div key="passphrase" className={css.stage}>
          <Heading level={3} bold className={css.stageTitle}>
            {t('forms:fields.passphrase.label')}
          </Heading>
          <hr className={css.separator} />
          <PassphraseInput handleChange={onPassphraseChange} />
          <div className={css.stageHelp}>
            {t('forms:fields.passphrase.enterPassphrase')}
          </div>
        </div>
      ) : null}

      {stage === 'connect' ? (
        <div key="connect" className={css.stage}>
          <Heading level={3} bold className={css.stageTitle}>
            {t('nft:walletConnect.title')}
          </Heading>
          <hr className={css.separator} />
          <Button fullWidth onClick={onConnectWallet}>
            {t('nft:walletConnect.connect')}
          </Button>
          <div className={css.stageHelp}>
            {t('nft:walletConnect.description')}
            <br />
            <br />
            {t('nft:walletConnect.helpText')}
            <br />
            <a
              href={ALGORAND_WALLET_LINK.url}
              target="_blank"
              rel="noreferrer nofollow"
              className={css.link}
            >
              {ALGORAND_WALLET_LINK.text}
            </a>
          </div>
        </div>
      ) : null}

      {stage === 'select-account' ? (
        <div key="select-account" className={css.stage}>
          <Heading level={3} bold className={css.stageTitle}>
            {t('nft:walletConnect.destinationWallet')}
          </Heading>
          <hr className={css.separator} />
          <RadioGroup
            value={importer.selectedAccount}
            onChange={importer.selectAccount}
          >
            <RadioGroup.Label hidden>
              {t('nft:walletConnect.destinationWallet')}
            </RadioGroup.Label>
            {importer.accounts.map((account) => (
              <RadioGroup.Option key={account} value={account}>
                {({ checked }) => (
                  <div className={css.accountItem}>
                    <span
                      className={clsx(
                        css.accountItemRadio,
                        checked && css.accountItemRadioChecked,
                        !checked && css.accountItemRadioUnchecked
                      )}
                    >
                      {checked ? (
                        <span
                          className={css.accountItemRadioCheckedInner}
                        ></span>
                      ) : null}
                    </span>
                    <span>{formatAlgoAddress(account)}</span>
                  </div>
                )}
              </RadioGroup.Option>
            ))}
          </RadioGroup>
          <div className={css.spacing}>
            <Button
              fullWidth
              onClick={onSelectAccount}
              disabled={!importer.selectedAccount}
            >
              {t('nft:walletConnect.selectAccount')}
            </Button>
          </div>
          <div className={css.spacing}>
            <Button
              onClick={onCancel}
              size="small"
              variant="link"
              fullWidth
              className={css.buttonLink}
            >
              {t('nft:walletConnect.orCancel')}
            </Button>
          </div>
        </div>
      ) : null}

      {stage === 'select-asset' ? (
        <div key="select-asset" className={css.stage}>
          <Heading level={3} bold className={css.stageTitle}>
            {t('nft:walletConnect.nfts')}
          </Heading>
          <hr className={css.separator} />
          <RadioGroup value={assetId} onChange={setAssetId}>
            <RadioGroup.Label hidden>
              {t('nft:walletConnect.nfts')}
            </RadioGroup.Label>
            {collectibles?.collectibles.map((collectible) => (
              <RadioGroup.Option
                key={collectible.id}
                value={collectible.address}
              >
                {({ checked }) => (
                  <div className={css.accountItem}>
                    <span
                      className={clsx(
                        css.accountItemRadio,
                        checked && css.accountItemRadioChecked,
                        !checked && css.accountItemRadioUnchecked
                      )}
                    >
                      {checked ? (
                        <span
                          className={css.accountItemRadioCheckedInner}
                        ></span>
                      ) : null}
                    </span>
                    <span>
                      {collectible.title} {collectible.edition}/
                      {collectible.totalEditions} ({collectible.address})
                    </span>
                  </div>
                )}
              </RadioGroup.Option>
            ))}
          </RadioGroup>
          <div className={css.spacing}>
            <Button fullWidth onClick={onTransfer} disabled={!assetId}>
              {t('nft:walletConnect.transfer')}
            </Button>
          </div>
          <div className={css.spacing}>
            <Button
              onClick={onCancel}
              size="small"
              variant="link"
              fullWidth
              className={css.buttonLink}
            >
              {t('nft:walletConnect.orCancel')}
            </Button>
          </div>
        </div>
      ) : null}

      {stage === 'transfer' ? (
        <div key="transfer">
          <Loading loadingText={importStatusMessage} />
        </div>
      ) : null}

      {stage === 'success' ? (
        <div key="success" className={css.stage}>
          <div className={css.terminalStage}>
            <span className={css.success}>
              <CheckCircleIcon width={48} />
            </span>
            <Heading bold level={2} size={1} className={css.terminalStageTitle}>
              {t('nft:walletConnect.sent')}
            </Heading>
            <LinkButton fullWidth href={urls.myCollectibles}>
              {t('nft:walletConnect.backToMyCollection')}
            </LinkButton>
          </div>
        </div>
      ) : null}

      {stage === 'error' ? (
        <div key="error" className={css.stage}>
          <div className={css.terminalStage}>
            <span className={css.error}>
              <ExclamationCircleIcon width={48} />
            </span>
            <Heading bold level={2} size={1} className={css.terminalStageTitle}>
              {error}
            </Heading>
            <LinkButton fullWidth href={urls.myCollectibles}>
              {t('nft:walletConnect.backToMyCollection')}
            </LinkButton>
          </div>
        </div>
      ) : null}
    </MyProfileLayout>
  )
}
