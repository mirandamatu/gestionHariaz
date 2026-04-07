import * as React from 'react'
import type { SelectHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

/**
 * Debe usar forwardRef para que react-hook-form (register) pueda enlazar la ref al <select> nativo.
 * Sin ref, los valores de los desplegables pueden no registrarse y el submit falla en validación silenciosa.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-2xl border bg-white/80 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})
Select.displayName = 'Select'
