import Image from 'next/image'

export interface CreditCardNetworkLogoProps {
  network: string
}

export default function CreditCardNetworkLogo({
  network,
}: CreditCardNetworkLogoProps) {
  return {
    visa: (
      <Image
        width={50}
        height={30}
        alt={network}
        src="/images/logos/visa.svg"
      />
    ),
    mastercard: (
      <Image
        width={50}
        height={30}
        alt={network}
        src="/images/logos/mastercard.svg"
      />
    ),
  }[network.toLowerCase()]
}
