import { Brand } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import Image from 'next/image'

import { ApiClient } from '@/clients/api-client'
import DefaultLayout from '@/layouts/default-layout'
import { cmsImageLoader } from '@/utils/cms-image-loader'

interface BrandPageProps {
  brand: Brand
}

export default function BrandPage({ brand }: BrandPageProps) {
  return (
    <DefaultLayout noPanel pageTitle={brand.name}>
      {brand.banner && (
        <Image
          loader={cmsImageLoader}
          src={brand.banner}
          alt={brand.name}
          width={1000}
          height={300}
          objectFit="cover"
          layout="responsive"
        />
      )}
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const brand = await ApiClient.instance.getBrand(
    context?.params?.brandSlug as string
  )

  return {
    props: {
      brand,
    },
  }
}
