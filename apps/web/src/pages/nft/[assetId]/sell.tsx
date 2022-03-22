import { CollectibleWithDetails } from '@algomart/schemas'
import { USD } from '@dinero.js/currencies'
import { toFormat } from 'dinero.js'
import { GetServerSideProps } from 'next'
import { FormEvent, useCallback, useState } from 'react'
import {
  exact,
  ExtractError,
  integer,
  max,
  min,
  number,
  object,
  required,
  string,
} from 'validator-fns'

import css from '@/components/wallet-transfers/wallet-transfers.module.css'

import { ApiClient } from '@/clients/api-client'
import Button from '@/components/button'
import LinkButton from '@/components/link-button'
import PassphraseInput from '@/components/passphrase-input/passphrase-input'
import CardPurchaseHeader from '@/components/purchase-form/cards/sections/card-header'
import TextInput from '@/components/text-input/text-input'
import { Environment } from '@/environment'
import { useConvertFromALGO } from '@/hooks/use-convert-from-algo'
import { useLocale } from '@/hooks/use-locale'
import DefaultLayout from '@/layouts/default-layout'
import { createTransformer, formatALGO } from '@/utils/format-currency'
import { urls } from '@/utils/urls'

// Minimum reserve price is 1 ALGO (0.0000001 ALGO)
const minReservePrice = 1
// The current supply is 10 billion ALGO https://algorand.foundation/faq#supply-
// To ensure correct behavior we're limiting the reserve price to 5 billion ALGO
const maxReservePrice = 5_000_000_000

const validateForm = async (values: Record<string, unknown>) => {
  const validate = object({
    passphrase: string(
      exact(6, 'Passphrase must be six characters.'),
      required('Passphrase is required.')
    ),
    reservePrice: number(
      min(minReservePrice, 'Reserve price must be one or greater.'),
      max(
        maxReservePrice,
        'Reserve price must be less than 1,000,000,000,000.'
      ),
      integer('Reserve price must be a whole number.'),
      required('Reserve price is required.')
    ),
  })

  return await validate(values)
}

export default function SellNFTPage({
  collectible,
}: {
  collectible: CollectibleWithDetails
}) {
  const locale = useLocale()
  const [values, setValues] = useState<{
    passphrase: string
    reservePrice: number | string
  }>({ passphrase: '', reservePrice: 1 })

  const [errors, setErrors] = useState<ExtractError<typeof validateForm>>({})
  const displayReservePrice =
    typeof values.reservePrice !== 'number' || Number.isNaN(values.reservePrice)
      ? 0
      : values.reservePrice * 1_000_000

  const converted = useConvertFromALGO(displayReservePrice, USD)

  const createAuction = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setErrors({})
      const result = await validateForm(values)

      if (result.state === 'valid') {
        // TODO: call new endpoint to create the auction
        console.log(result.value)
      } else {
        setErrors(result.errors)
      }
    },
    [values]
  )

  return (
    <DefaultLayout panelPadding pageTitle="Sell NFT">
      <div className={css.root}>
        <CardPurchaseHeader
          image={collectible.image}
          title={collectible.title}
          subtitle={collectible.collection?.name}
        />

        <div className="mb-12 space-y-4 text-sm leading-6 text-left text-base-textSecondary">
          <p>
            This will create an smart contract auction where the highest bidder
            will receive the NFT and your <strong>custodial wallet</strong> will
            receive the bid amount. You can then transfer the ALGOs to your
            non-custodial wallet.
          </p>
          <p>
            The auction goes live about five minutes after its creation and
            lasts for 72 hours. If no bids meet the reserve price then the NFT
            is returned to you and any invalid bids are returned to the bidders.
            You also have the option to cancel the auction before the five
            minute countdown.
          </p>
          <p>
            A 5% fee based on the final sale price is paid to the marketplace
            for all sales.
          </p>
        </div>

        <form onSubmit={createAuction} noValidate>
          <input type="hidden" name="collectibleId" value={collectible.id} />
          <div>
            <PassphraseInput
              id="passphrase"
              label="Passphrase"
              helpText="Unlock your custodial wallet."
              error={errors.passphrase as string}
              value={values.passphrase}
              handleChange={(value) =>
                setValues((previous) => ({ ...previous, passphrase: value }))
              }
            />
          </div>
          <div className="mt-6">
            <TextInput
              id="reservePrice"
              name="reservePrice"
              label="Reserve Price"
              helpText="The minimum accepted bid in ALGO."
              value={values.reservePrice}
              error={errors.reservePrice as string}
              onInput={({ currentTarget: { value } }) => {
                const reservePrice = Math.min(
                  Number.parseInt(value, 10),
                  maxReservePrice
                )
                setValues((previous) => ({
                  ...previous,
                  reservePrice: Number.isNaN(reservePrice)
                    ? value
                    : reservePrice,
                }))
              }}
            />
            <div className="mt-2 text-sm text-base-textTertiary">
              {formatALGO(displayReservePrice, locale)}
              {' currently equals about '}
              {converted ? toFormat(converted, createTransformer(locale)) : '-'}
            </div>
          </div>
          <div className="flex flex-col mt-12">
            <Button fullWidth type="submit">
              Create auction
            </Button>
            <LinkButton
              fullWidth
              variant="tertiary"
              href={urls.nft.replace(':assetId', String(collectible.address))}
            >
              Cancel
            </LinkButton>
          </div>
        </form>
      </div>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!Environment.isMarketplaceEnabled) {
    return {
      notFound: true,
    }
  }

  const { assetId } = context.query
  const collectible = await ApiClient.instance.getCollectible({
    assetId: Number(assetId),
  })

  if (!collectible) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      collectible,
    },
  }
}
