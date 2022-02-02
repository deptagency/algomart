import { CollectibleWithDetails } from '@algomart/schemas'
import { RadioGroup } from '@headlessui/react'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import Button from '../button'
import Heading from '../heading'

import css from './wallet-transfers.module.css'

export interface SelectAssetStageProps {
  assetId: number
  setAssetId: (assetId: number) => void
  collectibles: CollectibleWithDetails[]
  onConfirm: () => void
  onCancel: () => void
}

export default function SelectAssetStage(props: SelectAssetStageProps) {
  const { t } = useTranslation()

  return (
    <div className={css.stage}>
      <Heading level={3} bold className={css.stageTitle}>
        {t('nft:walletConnect.nfts')}
      </Heading>
      <hr className={css.separator} />
      <RadioGroup value={props.assetId} onChange={props.setAssetId}>
        <RadioGroup.Label hidden>
          {t('nft:walletConnect.nfts')}
        </RadioGroup.Label>
        {props.collectibles.map((collectible) => (
          <RadioGroup.Option key={collectible.id} value={collectible.address}>
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
                    <span className={css.accountItemRadioCheckedInner}></span>
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
        <Button fullWidth onClick={props.onConfirm} disabled={!props.assetId}>
          {t('nft:walletConnect.transfer')}
        </Button>
      </div>
      <div className={css.spacing}>
        <Button
          onClick={props.onCancel}
          size="small"
          variant="link"
          fullWidth
          className={css.buttonLink}
        >
          {t('nft:walletConnect.orCancel')}
        </Button>
      </div>
    </div>
  )
}
