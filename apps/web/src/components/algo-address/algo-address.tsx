import ExternalLink from '../external-link'

import { AppConfig } from '@/config'
import { formatAlgoAddress } from '@/utils/format-string'

export default function AlgoAddress({ address }: { address: string }) {
  return (
    <ExternalLink href={`${AppConfig.algoExplorerBaseURL}/address/${address}`}>
      {formatAlgoAddress(address)}
    </ExternalLink>
  )
}
