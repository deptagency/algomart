import css from './bid-activity-emoji.module.css'

export interface BidActivityEmojiProps {
  label: string
  symbol: string
}

export default function BidActivityEmoji({
  label,
  symbol,
}: BidActivityEmojiProps) {
  return (
    <div className={css.emojiWrapper}>
      <span
        aria-label={label}
        aria-hidden={label ? false : true}
        className={css.emoji}
        role="img"
      >
        {symbol}
      </span>
    </div>
  )
}
