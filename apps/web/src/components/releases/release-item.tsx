import { Product, ProductStatus, ProductType } from '@algomart/schemas'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './release-item.module.css'

import Counter from '@/components/counter/counter'
import Currency from '@/components/currency'

export interface ProductItemProps {
  product: Product
}

export default function ProductItem({ product }: ProductItemProps) {
  const { t } = useTranslation()

  const reserveMet =
    product.type === ProductType.Auction &&
    product?.activeBid &&
    product.activeBid >= product.price

  return (
    <div className={css.root}>
      <div className={css.imageWrapper}>
        <Image
          alt={product.title}
          height={250}
          layout="responsive"
          objectFit="cover"
          src={product.image}
          width={250}
        />
      </div>
      <div className={css.content}>
        <div className={css.title}>{product.title}</div>
      </div>

      {/* Metadata for active auction pack */}
      {product.type === ProductType.Auction &&
        product.status === ProductStatus.Active && (
          <div className={css.metadata}>
            <div>
              <div className={css.metadataLabel}>
                {reserveMet
                  ? t('release:Current Bid')
                  : t('release:Reserve Price')}
              </div>
              <div className={css.metadataValue}>
                {reserveMet ? (
                  <Currency value={product.activeBid || 0} />
                ) : (
                  t('release:Not Met')
                )}
              </div>
            </div>
            <div>
              <div className={css.metadataLabel}>{t('release:Ending In')}</div>
              <div className={css.metadataValue}>
                <Counter
                  plainString
                  target={new Date(product.auctionUntil as string)}
                />
              </div>
            </div>
          </div>
        )}

      {/* Metadata for expired auction pack */}
      {product.type === ProductType.Auction &&
        product.status === ProductStatus.Expired && (
          <div className={css.metadata}>
            <div>
              <div className={css.metadataLabel}>
                {reserveMet
                  ? t('release:Winning Bid')
                  : t('release:Reserve Price')}
              </div>
              <div className={css.metadataValue}>
                {reserveMet ? (
                  <Currency value={product.activeBid || 0} />
                ) : (
                  t('release:Not Met')
                )}
              </div>
            </div>
            <div>
              <div className={css.metadataLabel}>
                {t('release:Auction Has')}
              </div>
              <div className={css.metadataValue}>{t('release:Ended')}</div>
            </div>
          </div>
        )}

      {/* Metadata for upcoming auction pack */}
      {product.type === ProductType.Auction &&
        product.status === ProductStatus.Upcoming && (
          <div className={clsx(css.metadata, css.full)}>
            <div>
              <div className={css.metadataLabel}>
                {t('release:Starting In')}
              </div>
              <div className={css.metadataValue}>
                <Counter
                  plainString
                  target={new Date(product.releasedAt as string)}
                />
              </div>
            </div>
          </div>
        )}

      {/* Metadata for purchasable pack */}
      {product.type === ProductType.Purchase && (
        // Purchase Data
        <div className={css.metadata}>
          <div>
            <div className={css.metadataLabel}>{t('release:Mint Cost')}</div>
            <div className={css.metadataValue}>
              <Currency value={product.price} />
            </div>
          </div>
          <div>
            <div className={css.metadataLabel}>{t('release:Remaining')}</div>
            <div className={css.metadataValue}>
              {t('release:N of N', {
                available: product.available,
                total: product.total,
              })}
            </div>
          </div>
        </div>
      )}

      {/* Metadata for free pack */}
      {product.type === ProductType.Free && (
        <div className={clsx(css.metadata, css.full)}>
          <div>
            <div className={css.metadataLabel}>
              {t('common:actions.Claim My Edition')}
            </div>
            <div className={css.metadataValue}>{t('common:statuses.Free')}</div>
          </div>
        </div>
      )}

      {/* Metadata for redeemable pack */}
      {product.type === ProductType.Redeem && (
        <div className={clsx(css.metadata, css.full)}>
          <div>
            <div className={css.metadataLabel}>
              {t('common:actions.Claim My Edition')}
            </div>
            <div className={css.metadataValue}>
              {t('common:statuses.Redeemable')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
