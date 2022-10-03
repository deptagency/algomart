export default function CounterDigit({
  digit,
  label,
}: {
  digit: number
  label: string
}) {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center justify-center mb-2 text-[20px] font-bold text-white bg-[#03102A] rounded w-full aspect-1">
        <span suppressHydrationWarning>{digit}</span>
      </div>
      <div className="text-xs font-bold">{label}</div>
    </div>
  )
}
