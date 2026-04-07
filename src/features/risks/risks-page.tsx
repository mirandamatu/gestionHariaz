import { useMemo } from 'react'

import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { riskTone } from '@/lib/formatters'
import { calculateClientRisks } from '@/lib/risk-rules'
import { useCrmStore } from '@/store/crm-store'

export function RisksPage() {
  const clients = useCrmStore((state) => state.clients)
  const payments = useCrmStore((state) => state.payments)
  const risks = useMemo(() => calculateClientRisks(clients, payments), [clients, payments])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Riesgos"
        title="Riesgo manual del equipo"
        description="Vista simple de las cuentas donde el equipo decidió marcar un riesgo manualmente."
      />
      <div className="grid gap-4">
        {risks.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              No hay clientes con riesgo manual cargado.
            </CardContent>
          </Card>
        ) : (
          risks.map((risk) => (
            <Card key={risk.id}>
              <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold">{risk.clienteNombre}</p>
                  <p className="text-sm text-muted-foreground">{risk.motivo}</p>
                  <p className="mt-1 text-sm text-primary">
                    Próxima acción: {risk.proximaAccion ?? 'Definir acción'}
                  </p>
                </div>
                <Badge className={riskTone(risk.severidad)}>{risk.severidad}</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
