import { CollectibleWithDetails } from '@algomart/schemas'
import { RadioGroup } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './wallet-transfers.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'

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
        <RadioGroup.Label>{t('nft:walletConnect.selectNFT')}</RadioGroup.Label>

        <div className="grid grid-cols-1 mt-4 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
          {props.collectibles.map((collectible) => (
            <RadioGroup.Option
              key={collectible.id}
              value={collectible.address}
              className={({ checked, active }) =>
                clsx(
                  checked ? 'border-transparent' : 'border-base-border',
                  active ? 'ring-2 ring-action-secondary' : '',
                  'relative bg-base-bgCard text-base-textPrimary border shadow-sm cursor-pointer focus:outline-none'
                )
              }
            >
              {({ checked, active }) => (
                <>
                  <div className="relative w-full overflow-hidden aspect-w-1 aspect-h-1">
                    <Image
                      src={collectible.image}
                      alt={collectible.title}
                      layout="fill"
                      className="object-contain"
                      objectFit="cover"
                    />
                  </div>
                  <div className="p-2 text-center">
                    <div className="flex flex-col">
                      <RadioGroup.Label
                        as="span"
                        className="block overflow-hidden text-sm font-medium text-base-textPrimary text-ellipsis whitespace-nowrap"
                      >
                        {collectible.title}
                      </RadioGroup.Label>
                      <RadioGroup.Description
                        as="span"
                        className="block mt-1 overflow-hidden text-xs text-base-textTertiary text-ellipsis whitespace-nowrap"
                      >
                        Edition {collectible.edition} /{' '}
                        {collectible.totalEditions}
                      </RadioGroup.Description>
                      <RadioGroup.Description
                        as="span"
                        className="block mt-1 overflow-hidden text-xs text-base-textSecondary text-ellipsis whitespace-nowrap"
                      >
                        ASA ID: {collectible.address}
                      </RadioGroup.Description>
                    </div>
                  </div>
                  <CheckCircleIcon
                    className={clsx(
                      !checked ? 'invisible' : '',
                      'h-5 w-5 text-action-secondary top-2 right-2 absolute bg-action-secondaryContrastText rounded-full'
                    )}
                    aria-hidden="true"
                  />
                  <div
                    className={clsx(
                      active ? 'border' : 'border-2',
                      checked
                        ? 'border-action-secondary'
                        : 'border-transparent',
                      'absolute -inset-px  pointer-events-none'
                    )}
                    aria-hidden="true"
                  />
                </>
              )}
            </RadioGroup.Option>
          ))}
        </div>
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
