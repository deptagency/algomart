import { AdjustmentsIcon, XIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { useState } from 'react'

import css from './product-filters-mobile.module.css'

import Button from '@/components/button'
import Dialog from '@/components/dialog/dialog'
import ProductFilterPrice from '@/components/products/product-filter-price'
import ProductFilterType from '@/components/products/product-filter-type'

export default function ProductFiltersMobile() {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <>
      <Dialog
        open={showFilters}
        onClose={() => setShowFilters(false)}
        overlayClassName={css.overlay}
        containerClassName={css.container}
        contentClassName={css.content}
        className={css.dialog}
      >
        <div className={css.root}>
          <div className={css.dialogHeadingRow}>
            <Button
              className={css.closeButton}
              disablePadding
              onClick={() => setShowFilters(false)}
            >
              <XIcon width={16} height={16} />
            </Button>
          </div>
          <ProductFilterPrice />
          <ProductFilterType />
        </div>
      </Dialog>

      <Button
        className={clsx(css.mobileFilterButton, { hidden: showFilters })}
        disablePadding
        onClick={() => setShowFilters(!showFilters)}
      >
        <AdjustmentsIcon width={24} height={24} />
      </Button>
    </>
  )
}
