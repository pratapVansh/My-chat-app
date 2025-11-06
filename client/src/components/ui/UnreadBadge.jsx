import { memo } from 'react'

const UnreadBadge = memo(({ count, className = '' }) => {
  if (!count || count === 0) return null

  return (
    <div
      className={`bg-green-500 text-white text-xs rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-medium ${className}`}
    >
      {count > 99 ? '99+' : count}
    </div>
  )
})

UnreadBadge.displayName = 'UnreadBadge'

export default UnreadBadge