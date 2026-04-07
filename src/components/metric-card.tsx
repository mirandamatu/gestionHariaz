import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function MetricCard({
  label,
  value,
  hint,
  icon,
  to,
}: {
  label: string
  value: string | number
  hint: string
  icon: ReactNode
  /** Si se define, la tarjeta es clicable y navega a esta ruta */
  to?: string
}) {
  const inner = (
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div>
      </div>
    </CardContent>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          'block overflow-hidden rounded-3xl outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring',
          'hover:shadow-md',
        )}
      >
        <Card className="h-full border-2 border-transparent transition-colors hover:border-primary/20">
          {inner}
        </Card>
      </Link>
    )
  }

  return <Card className="overflow-hidden">{inner}</Card>
}
