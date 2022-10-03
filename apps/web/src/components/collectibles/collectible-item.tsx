import {
  CollectibleListingStatus,
  CollectibleWithDetails,
} from '@algomart/schemas'
import {
  CheckIcon,
  DotsHorizontalIcon,
  DuplicateIcon,
  PlusIcon,
  TagIcon,
  XCircleIcon,
} from '@heroicons/react/outline'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import css from './collectible-item.module.css'

import AppLink from '@/components/app-link/app-link'
import Credits from '@/components/currency/credits'
import Pill from '@/components/pill'
import { Popover } from '@/components/popover'
import { urlFor, urls } from '@/utils/urls'

export interface CollectibleItemProps {
  collectible?: CollectibleWithDetails
  href?: string
  isNew?: boolean
  listingStatus?: CollectibleListingStatus
  mode?: 'add' | 'remove' | 'selected'
  onClick?: () => void
  showSellMenu?: boolean
  uncollected?: boolean
}

function CollectibleMenu({ t, address, setIsOpen, isListed }) {
  const addressURL = urlFor(urls.nft, { assetId: address })

  const handleCopy = useCallback(() => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}${addressURL}`)
    }
    setIsOpen(false)
  }, [addressURL, setIsOpen])

  return (
    <div className={css.collectibleMenu}>
      <AppLink
        className={css.collectibleMenuItem}
        href={`${addressURL}/list-for-sale`}
        data-e2e="collectible-action-menu-transact"
      >
        <TagIcon className="text-action-primary" width={20} />
        <span className="ml-2">
          {isListed
            ? t('common:actions.View Listing')
            : t('common:actions.Sell')}
        </span>
      </AppLink>
      <button className={css.collectibleMenuItem} onClick={handleCopy}>
        <DuplicateIcon className="text-action-primary" width={20} />
        <span className="ml-2">{t('common:actions.Copy')}</span>
      </button>
    </div>
  )
}

export default function CollectibleItem({
  collectible,
  href,
  isNew = false,
  listingStatus,
  mode,
  onClick,
  showSellMenu = true,
  uncollected = false,
}: CollectibleItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()

  const isListed = listingStatus === CollectibleListingStatus.Active

  if (!collectible || uncollected) {
    return (
      <div className={css.root}>
        <div className={css.unrevealed}>
          <Image
            src="/images/textures/nft-placeholder.jpg"
            alt={t('common:statuses.Uncollected')}
            width="100%"
            height="100%"
            objectFit="cover"
            layout="responsive"
          />
        </div>
        <span className={css.title} title={t('common:statuses.Uncollected')}>
          {t('common:statuses.Uncollected')}
        </span>
      </div>
    )
  }

  const img = (
    <Image
      src={collectible.image}
      alt={collectible.title}
      width={160}
      height={160}
      objectFit="cover"
      layout="responsive"
    />
  )

  const ImageWrapperTag =
    typeof href === 'string'
      ? AppLink
      : typeof onClick === 'function'
      ? 'button'
      : 'div'

  return (
    <div className={css.root}>
      {mode === 'remove' || (!onClick && !href) ? (
        <>
          <div className={css.imageWrapper}>{img}</div>
          {mode === 'remove' && onClick && (
            <div>
              <button onClick={onClick} className={css.removeButton}>
                <XCircleIcon className={css.removeIcon} />
              </button>
            </div>
          )}
        </>
      ) : (
        <ImageWrapperTag
          onClick={onClick}
          href={href}
          className={css.imageWrapper}
        >
          {img}
          {(mode === 'add' || mode === 'selected') && (
            <div className={css.overlay}>
              {mode === 'add' ? (
                <PlusIcon className={css.addIcon} />
              ) : (
                <CheckIcon className={css.checkIcon} />
              )}
            </div>
          )}
          {isNew && (
            <div className={css.badgeNew}>{t('common:statuses.New')}</div>
          )}
          {isListed && (
            <div data-e2e="collectible-listed-banner" className={css.ribbon}>
              {t('common:statuses.For Sale')}
            </div>
          )}
          {isListed && collectible.price && (
            <div className={css.badgePrice}>
              {<Credits parentheses value={collectible.price} />}
            </div>
          )}
        </ImageWrapperTag>
      )}
      {mode !== 'remove' && (
        <>
          {/* Rarity and tags */}
          <div className={css.pills}>
            <>
              {collectible.rarity && (
                <Pill color={collectible.rarity?.color} small>
                  {collectible.rarity?.name}
                </Pill>
              )}
              {collectible.edition && (
                <Pill small color="#27568F">
                  #{collectible.edition}/{collectible.totalEditions}
                </Pill>
              )}
            </>
          </div>

          {/* Title */}
          <h4 className={css.title} title={collectible.title}>
            <div>{collectible.title}</div>
          </h4>

          {/* Controls */}
          {showSellMenu && (
            <div className={css.metaBoxBottom}>
              <div className={css.metaBoxBottomContent}>
                {collectible?.collection?.image ? (
                  <div className={css.collectionImage}>
                    <Image
                      src={collectible.collection.image}
                      alt={collectible.collection.name}
                      width={32}
                      height={32}
                      objectFit="cover"
                      layout="fixed"
                    />
                  </div>
                ) : (
                  <div />
                )}
                <Popover
                  noPad
                  isOpen={isOpen}
                  content={() => (
                    <CollectibleMenu
                      address={collectible.address}
                      isListed={isListed}
                      setIsOpen={setIsOpen}
                      t={t}
                    />
                  )}
                  positions={['left', 'top']}
                  padding={12}
                  boundaryInset={16}
                  reposition={false}
                  onClickOutside={() => setIsOpen(false)}
                >
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    data-e2e="collectible-action-button"
                    className={css.actionsButton}
                  >
                    <DotsHorizontalIcon width="1em" />
                  </button>
                </Popover>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
