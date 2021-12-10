import { PublishedPack } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useState } from 'react'

import css from './crypto-form.module.css'

import Button from '@/components/button'
import Checkbox from '@/components/checkbox'
import Heading from '@/components/heading'
import Bid from '@/components/purchase-form/shared/bid'
import { FormValidation } from '@/contexts/payment-context'

const formatAccount = (account: string) =>
  `${account.slice(0, 6)}...${account.slice(-6)}`

export interface CryptoFormProps {
  account: string
  bid: string | null
  className?: string
  connect: () => Promise<void>
  connected: boolean
  currentBid: number | null
  disconnect: () => Promise<void>
  formErrors?: FormValidation
  handleSubmitPurchase: (event: FormEvent<HTMLFormElement>) => Promise<void>
  initialBid?: string
  isAuctionActive: boolean
  price: string | null
  release?: PublishedPack
  setBid: (bid: string | null) => void
}

export default function CryptoForm({
  account,
  bid,
  className,
  connect,
  connected,
  currentBid,
  disconnect,
  formErrors,
  handleSubmitPurchase,
  initialBid,
  isAuctionActive,
  price,
  release,
  setBid,
}: CryptoFormProps) {
  const { t } = useTranslation()
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false)
  return (
    <form className={className} onSubmit={handleSubmitPurchase}>
      <Heading className={css.heading} level={1}>
        {t('common:nav.payment.Pay with Crypto Wallet')}
      </Heading>
      {isAuctionActive ? (
        <>
          <Bid
            bid={bid}
            className={css.bid}
            currentBid={currentBid}
            initialBid={initialBid}
            setBid={setBid}
          />
          <Checkbox
            checked={isConfirmed}
            name="confirmBid"
            label={t('forms:fields.bid.confirmation')}
            onChange={() => setIsConfirmed(!isConfirmed)}
          />
        </>
      ) : (
        <>
          {connected ? (
            <>
              <p>{formatAccount(account)}</p>
              <Button onClick={disconnect}>Disconnect</Button>
            </>
          ) : (
            <Button onClick={connect}>Connect</Button>
          )}
        </>
      )}
      {/* Submit */}
      <Button className={css.submit} fullWidth type="submit" variant="primary">
        {isAuctionActive
          ? t('common:actions.Place Bid')
          : t('common:actions.Purchase')}
      </Button>
    </form>
  )
}
