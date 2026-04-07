import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatCurrency, formatDate, statusLabel } from '@/lib/formatters'
import { useCrmStore } from '@/store/crm-store'
import type { Payment } from '@/types/domain'

export function PaymentsPage() {
  const payments = useCrmStore((state) => state.payments)
  const clients = useCrmStore((state) => state.clients)
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      payments.filter((payment) => {
        const client = clients.find((item) => item.id === payment.clienteId)
        const matchesStatus = status === 'all' || payment.estado === status
        const matchesQuery = `${client?.nombreCliente ?? ''} ${payment.moneda}`
          .toLowerCase()
          .includes(query.toLowerCase())
        return matchesStatus && matchesQuery
      }),
    [clients, payments, query, status],
  )

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: 'clienteId',
        header: 'Cliente',
        cell: ({ row }) => clients.find((client) => client.id === row.original.clienteId)?.nombreCliente,
      },
      {
        accessorKey: 'fechaVencimiento',
        header: 'Vencimiento',
        cell: ({ row }) => formatDate(row.original.fechaVencimiento),
      },
      {
        accessorKey: 'monto',
        header: 'Monto',
        cell: ({ row }) => formatCurrency(row.original.monto, row.original.moneda),
      },
      { accessorKey: 'moneda', header: 'Moneda' },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => <Badge>{statusLabel(row.original.estado)}</Badge>,
      },
      { accessorKey: 'medioPago', header: 'Medio de pago' },
      { accessorKey: 'observaciones', header: 'Observaciones' },
    ],
    [clients],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pagos"
        title="Cobranza y estado de pagos"
        description="Filtrá vencidos, pendientes, al día, especiales o cuentas que todavía no facturan."
      />

      <div className="grid gap-3 rounded-3xl border bg-white/80 p-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="al_dia">Al día</option>
          <option value="pendiente">Pendiente</option>
          <option value="vencido">Vencido</option>
          <option value="parcial">Parcial</option>
          <option value="pausado">Pausado</option>
          <option value="no_facturar_aun">No facturar aún</option>
        </Select>
        <Input placeholder="Buscar por cliente o moneda..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  )
}
