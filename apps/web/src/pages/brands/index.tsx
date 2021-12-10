import { Brands } from '@algomart/schemas'
import { GetServerSidePropsContext } from 'next'
import Image from 'next/image'

import css from './brands.module.css'

import { ApiClient } from '@/clients/api-client'
import Heading from '@/components/heading'
import DefaultLayout from '@/layouts/default-layout'
import { cmsImageLoader } from '@/utils/cms-image-loader'

interface BrandsProps {
  brands: Brands
  total: number
}

export default function BrandsPage({ total, brands }: BrandsProps) {
  return (
    <DefaultLayout noPanel>
      <ul className={css.brandsContainer}>
        {brands.map((brand: any) => (
          <li key={brand.id} className={css.brandCard}>
            {!brand.logo && (
              <Heading level={3} className={css.brandNoLogo}>
                {brand.name}
              </Heading>
            )}
            {brand.logo && (
              <Image
                loader={cmsImageLoader}
                src={brand.logo}
                alt={brand.name}
                width={356}
                height={356}
                objectFit="cover"
                layout="responsive"
              />
            )}
          </li>
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
