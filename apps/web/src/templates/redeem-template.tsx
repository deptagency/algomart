import Logo from '@/components/logo/logo'
import RedeemCode from '@/components/redeem-code/redeem-code'

interface RedeemTemplateProps {
  error?: string
  handleChange(value: string): void
  redeemCode: string
}

export default function RedeemTemplate({
  error,
  handleChange,
  redeemCode,
}: RedeemTemplateProps) {
  return (
    <section className="flex flex-col flex-grow bg-base-bg">
      <div className="relative w-20 left-6 top-6 text-base-tertiary">
        <Logo />
      </div>
      <div className="flex items-center justify-center flex-grow w-full max-w-xl m-auto">
        <RedeemCode
          error={error}
          handleChange={handleChange}
          redeemCode={redeemCode}
        />
      </div>
    </section>
  )
}
