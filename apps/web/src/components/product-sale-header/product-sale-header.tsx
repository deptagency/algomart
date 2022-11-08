import css from './product-sale-header.module.css'

import Credits from '@/components/currency/credits'
import { H1 } from '@/components/heading'
import RatioImage from '@/components/ratio-image'

export interface ProductSaleHeaderProps {
  imageUrl?: string
  title: string
  price?: number
  imageSize?: number
}

export default function ProductSaleHeader({
  imageUrl,
  title,
  price,
  imageSize = 110,
}: ProductSaleHeaderProps) {
  return (
    <header className={css.root}>
      <div className={css.wrapper}>
        <RatioImage alt={title} src={imageUrl} height={imageSize} />

        <div>
          <H1 size={3} mb={2}>
            {title}
          </H1>
          {price && (
            <div className={css.priceLabel}>
              {price && <Credits parentheses value={price} />}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
