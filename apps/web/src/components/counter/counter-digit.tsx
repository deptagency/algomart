export default function CounterDigit({
  digit,
  label,
}: {
  digit: number
  label: string
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center mb-2 text-2xl font-bold text-white bg-gray-800 rounded w-14 h-14 md:w-16 md:h-16">
        <span suppressHydrationWarning>{digit}</span>
      </div>
      <div className="text-xs font-bold">{label}</div>
    </div>
  )
}
