import { BrandListWithTotal } from '@algomart/schemas'
import Image from 'next/image'

import css from './brands.module.css'

import { ApiClient } from '@/clients/api-client'
import Heading from '@/components/heading'
import DefaultLayout from '@/layouts/default-layout'
import { cmsImageLoader } from '@/utils/cms-image-loader'

export default function BrandsPage({ brands }: BrandListWithTotal) {
  return (
    <DefaultLayout noPanel>
      <ul className={css.brandsContainer}>
        {brands.map((brand) => (
          <a href={`brands/${brand.slug}`} key={brand.id}>
            <li className={css.brandCard}>
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
          </a>
        ))}
      </ul>
    </DefaultLayout>
  )
}

export async function getServerSideProps() {
  return {
    props: await ApiClient.instance.getBrands(),
  }
}
