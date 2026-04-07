import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Avatar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary',
        className,
      )}
      {...props}
    />
  )
}
