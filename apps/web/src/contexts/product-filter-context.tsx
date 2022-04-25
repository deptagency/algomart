import { createContext, ReactNode, useContext } from 'react'

import { ProductFilter } from '@/hooks/use-product-filter'

export const ProductFilterContext = createContext<ProductFilter | null>(null)

export function useProductFilterContext() {
  const productFilter = useContext(ProductFilterContext)
  if (!productFilter) throw new Error('ProductFilterProvider missing')
  return productFilter
}

export function ProductFilterProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ProductFilter
}) {
  return (
    <ProductFilterContext.Provider value={value}>
      {children}
    </ProductFilterContext.Provider>
  )
}
