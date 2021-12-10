import { Brands } from '@algomart/schemas'
import { GetServerSidePropsContext } from 'next'

import { ApiClient } from '@/clients/api-client'
import DefaultLayout from '@/layouts/default-layout'

interface BrandsProps {
  brands: Brands
  total: number
}

export default function BrandsPage({ total, brands }: BrandsProps) {
  return (
    <DefaultLayout noPanel>
      Brands: {total}
      <ul>
        {brands.map((brand: any) => (
          <li key={brand.id}>{brand.name}</li>
        ))}
      </ul>
    </DefaultLayout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: await ApiClient.instance.getBrands(),
  }
}
