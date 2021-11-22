import { useState } from 'react'

import Banner from '../banner/banner'
import Button from '../button'
import TransferModal from '../modals/transfer-modal'

import { useTransferPack } from '@/hooks/use-transfer-pack'
import { useUntransferredPacks } from '@/hooks/use-untransferred-packs'

export default function UntransferredPacks() {
  const { data } = useUntransferredPacks()
  const [open, setOpen] = useState(false)
  const [transfer, status, reset] = useTransferPack(
    data && data.total > 0 ? data.packs[0].id : null
  )

  if (!data || data.total === 0) return null

  return (
    <Banner>
      <p>You have {data.total} unclaimed pack(s).</p>
      <p>
        <Button
          size="small"
          variant="primary"
          onClick={() => {
            setOpen(true)
          }}
        >
          Transfer {data.packs[0].title} pack
        </Button>
      </p>
      <TransferModal
        packTemplate={data.packs[0]}
        onClose={() => {
          setOpen(false)
        }}
        onRetry={reset}
        onSubmit={transfer}
        open={open}
        transferStatus={status}
      />
    </Banner>
  )
}
