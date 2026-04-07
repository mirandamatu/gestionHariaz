import { useEffect, useState } from 'react'
import { Copy, Edit3, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { resolveUserName } from '@/lib/analytics'
import { formatCurrency, formatDate, riskTone, statusLabel, taskStatusLabel, taskStatusTone, taskTypeLabel } from '@/lib/formatters'
import { calculateClientRisks } from '@/lib/risk-rules'
import { useCrmStore } from '@/store/crm-store'
import { ClientFormDialog, type ClientFormValues } from '@/features/clients/client-form-dialog'
import { MeetingTodosEditor } from '@/features/interactions/meeting-todos-editor'
import type { Client, ClientAsset, ClientCredential } from '@/types/domain'

export function ClientDetailPage() {
  const { clientId } = useParams()
  const users = useCrmStore((state) => state.users)
  const clients = useCrmStore((state) => state.clients)
  const upsertClient = useCrmStore((state) => state.upsertClient)
  const upsertCredential = useCrmStore((state) => state.upsertCredential)
  const deleteCredential = useCrmStore((state) => state.deleteCredential)
  const contactsState = useCrmStore((state) => state.contacts)
  const interactionsState = useCrmStore((state) => state.interactions)
  const paymentsState = useCrmStore((state) => state.payments)
  const tasksState = useCrmStore((state) => state.tasks)
  const calendarEvents = useCrmStore((state) => state.calendarEvents)
  const manuals = useCrmStore((state) => state.manuals)
  const snapshot = {
    users,
    clients,
    contacts: contactsState,
    interactions: interactionsState,
    payments: paymentsState,
    tasks: tasksState,
    calendarEvents,
    manuals,
  }

  const client = snapshot.clients.find((entry) => entry.id === clientId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const now = new Date().toISOString()
  const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5MB por archivo (mock localStorage)

  const [sheetUrlDraft, setSheetUrlDraft] = useState('')
  const [linkUrlDraft, setLinkUrlDraft] = useState('')
  const [linkNameDraft, setLinkNameDraft] = useState('')
  const [credDialogOpen, setCredDialogOpen] = useState(false)
  const [credentialDraft, setCredentialDraft] = useState({
    id: '' as string | undefined,
    plataforma: '',
    usuario: '',
    contrasena: '',
    notas: '',
  })
  const [showCredPassword, setShowCredPassword] = useState(false)
  const [revealedCredPw, setRevealedCredPw] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setSheetUrlDraft(client?.googleSheetUrl ?? '')
  }, [client?.id, client?.googleSheetUrl])

  if (!client) {
    return (
      <Card>
        <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4">
          <p className="text-xl font-semibold">Cliente no encontrado</p>
          <Button asChild>
            <Link to="/clientes">Volver a clientes</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const detailClient: Client = client

  function formatBytes(bytes: number) {
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let value = bytes
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024
      i++
    }
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
  }

  function removeAsset(assetId: string) {
    const nextAssets = (detailClient.archivos ?? []).filter((a) => a.id !== assetId)
    upsertClient({
      ...detailClient,
      archivos: nextAssets,
      updatedAt: new Date().toISOString(),
    })
    toast.success('Archivo eliminado')
  }

  async function appendFiles(files: FileList | null) {
    if (!files) return
    const allFiles = Array.from(files)
    if (!allFiles.length) return

    const tooLarge = allFiles.filter((f) => f.size > MAX_FILE_BYTES)
    const allowed = allFiles.filter((f) => f.size <= MAX_FILE_BYTES)

    if (tooLarge.length) {
      toast.error(`Se omitieron ${tooLarge.length} archivo(s) porque superan 5MB.`)
    }

    if (!allowed.length) return

    const readDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
        reader.readAsDataURL(file)
      })

    const updatedAt = new Date().toISOString()
    const nuevos: ClientAsset[] = await Promise.all(
      allowed.map(async (file) => ({
        id: crypto.randomUUID(),
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: await readDataUrl(file),
        createdAt: updatedAt,
      })),
    )

    upsertClient({
      ...detailClient,
      archivos: [...(detailClient.archivos ?? []), ...nuevos],
      updatedAt,
    })
    toast.success(`${nuevos.length} archivo(s) subido(s)`)
  }

  function addLinkAsset() {
    const url = linkUrlDraft.trim()
    const name = linkNameDraft.trim()
    if (!url || !name) {
      toast.error('Completá la URL y el nombre del link')
      return
    }
    const updatedAt = new Date().toISOString()
    upsertClient({
      ...detailClient,
      archivos: [
        ...(detailClient.archivos ?? []),
        {
          id: crypto.randomUUID(),
          fileName: name,
          mimeType: 'link',
          size: 0,
          linkUrl: url,
          createdAt: updatedAt,
        },
      ],
      updatedAt,
    })
    setLinkUrlDraft('')
    setLinkNameDraft('')
    toast.success('Link agregado')
  }

  function openNewCredential() {
    setCredentialDraft({ id: undefined, plataforma: '', usuario: '', contrasena: '', notas: '' })
    setShowCredPassword(false)
    setCredDialogOpen(true)
  }

  function openEditCredential(c: ClientCredential) {
    setCredentialDraft({
      id: c.id,
      plataforma: c.plataforma,
      usuario: c.usuario,
      contrasena: c.contrasena,
      notas: c.notas ?? '',
    })
    setShowCredPassword(false)
    setCredDialogOpen(true)
  }

  function saveCredential() {
    const plataforma = credentialDraft.plataforma.trim()
    const usuario = credentialDraft.usuario.trim()
    const contrasena = credentialDraft.contrasena
    if (!plataforma || !usuario || !contrasena) {
      toast.error('Plataforma, usuario y contraseña son obligatorios')
      return
    }
    const ts = new Date().toISOString()
    const id = credentialDraft.id ?? crypto.randomUUID()
    const prev = detailClient.credenciales?.find((c) => c.id === id)
    upsertCredential(detailClient.id, {
      id,
      plataforma,
      usuario,
      contrasena,
      notas: credentialDraft.notas.trim() || null,
      createdAt: prev?.createdAt ?? ts,
      updatedAt: ts,
    })
    toast.success(prev ? 'Credencial actualizada' : 'Credencial guardada')
    setCredDialogOpen(false)
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copiado al portapapeles')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  const contacts = snapshot.contacts.filter((contact) => contact.clienteId === detailClient.id)
  const interactions = snapshot.interactions.filter((interaction) => interaction.clienteId === detailClient.id)
  const payments = snapshot.payments.filter((payment) => payment.clienteId === detailClient.id)
  const tasks = snapshot.tasks.filter((task) => task.clienteId === detailClient.id)
  const risks = calculateClientRisks([detailClient], snapshot.payments)
  const openTasks = tasks.filter((task) => task.estado === 'pendiente' || task.estado === 'en_progreso')
  const urgentTasks = openTasks.filter((task) => task.fecha < now.slice(0, 10))
  const openMeetingTodos = interactions.reduce(
    (acc, interaction) => acc + interaction.pendientes.filter((todo) => !todo.completado).length,
    0,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detalle de cliente"
        title={detailClient.nombreCliente}
        description={`${detailClient.plan} · ${detailClient.estadoComercial} · ${detailClient.estadoOperativo}`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(true)
              }}
            >
              <Edit3 className="size-4" />
              Editar
            </Button>
            <Button variant="outline" asChild>
              <Link to="/clientes">Volver</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Qué hacer ahora</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Próxima acción</p>
              <p className="mt-1 font-medium">{detailClient.proximaAccion ?? 'Definir siguiente paso'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Próximo seguimiento</p>
              <p className="mt-1 font-medium">{formatDate(detailClient.fechaProximoSeguimiento)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tareas abiertas</p>
              <p className="mt-1 font-medium">
                {openTasks.length}
                {urgentTasks.length ? ` · ${urgentTasks.length} vencidas` : ''}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendientes de reuniones</p>
              <p className="mt-1 font-medium">{openMeetingTodos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estado de la cuenta</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Responsable</p>
              <p className="mt-1 font-medium">{resolveUserName(snapshot, detailClient.responsablePrincipal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado de pago</p>
              <p className="mt-1 font-medium">{statusLabel(detailClient.estadoPago)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado comercial / operativo</p>
              <p className="mt-1 font-medium">
                {detailClient.estadoComercial} · {detailClient.estadoOperativo}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Riesgo y precio</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Riesgo manual</p>
              {detailClient.nivelRiesgo ? (
                <Badge className={riskTone(detailClient.nivelRiesgo)}>{detailClient.nivelRiesgo}</Badge>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Sin marcar</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bloqueo actual</p>
              <p className="mt-1">{detailClient.bloqueoActual ?? 'Sin bloqueos activos'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Precio</p>
              <p className="font-semibold">{formatCurrency(detailClient.precio, detailClient.moneda)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="contactos">Contactos</TabsTrigger>
          <TabsTrigger value="interacciones">Interacciones</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
          <TabsTrigger value="implementacion">Implementación</TabsTrigger>
          <TabsTrigger value="archivos">Archivos</TabsTrigger>
          <TabsTrigger value="accesos">Accesos</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>Resumen ejecutivo</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Descripción</p>
                  <p className="mt-1">{detailClient.descripcion ?? 'Sin descripción cargada.'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notas internas</p>
                  <p className="mt-1">{detailClient.notasInternas ?? 'Sin notas internas.'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Último contacto</p>
                  <p className="mt-1">{formatDate(detailClient.fechaUltimoContacto)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Google Sheet</p>
                  <p className="mt-1">{detailClient.googleSheetUrl ? 'Vinculado' : 'Sin link cargado'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Riesgo y seguimiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {risks.length ? (
                  risks.map((risk) => (
                    <div key={risk.id} className="rounded-2xl border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{risk.motivo}</p>
                        <Badge className={riskTone(risk.severidad)}>{risk.severidad}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{risk.proximaAccion ?? 'Sin próxima acción'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin riesgo manual cargado para este cliente.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contactos">
          <Card>
            <CardContent className="space-y-3 p-6">
              {contacts.map((contact) => (
                <div key={contact.id} className="rounded-2xl border p-4">
                  <p className="font-medium">{contact.nombre}</p>
                  <p className="text-sm text-muted-foreground">{contact.cargo ?? 'Sin cargo'}</p>
                  <p className="text-sm text-muted-foreground">{contact.email ?? 'Sin email'}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interacciones">
          <Card>
            <CardContent className="space-y-4 p-6">
              {interactions.map((interaction) => (
                <div key={interaction.id} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{interaction.titulo}</p>
                    <Badge>{interaction.tipo}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{interaction.descripcion}</p>
                  <div className="mt-4 border-t pt-4">
                    <MeetingTodosEditor
                      compact
                      interactionId={interaction.id}
                      clientName={detailClient.nombreCliente}
                      title={interaction.titulo}
                      fechaEvento={interaction.fechaEvento}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagos">
          <Card>
            <CardContent className="space-y-3 p-6">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-2xl border p-4">
                  <div>
                    <p className="font-medium">{formatCurrency(payment.monto, payment.moneda)}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(payment.fechaVencimiento)}</p>
                  </div>
                  <Badge>{statusLabel(payment.estado)}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tareas">
          <Card>
            <CardContent className="space-y-3 p-6">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay tareas vinculadas a esta cuenta.</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{task.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(task.fecha)} · {taskTypeLabel(task.tipo)} · {resolveUserName(snapshot, task.asignadoA)}
                        </p>
                      </div>
                      <Badge className={taskStatusTone(task.estado)}>{taskStatusLabel(task.estado)}</Badge>
                    </div>
                    {task.descripcion ? <p className="mt-2 text-sm text-muted-foreground">{task.descripcion}</p> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementacion">
          <Card>
            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Inicio</p>
                <p className="mt-1">{formatDate(detailClient.fechaInicioImplementacion)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha estimada</p>
                <p className="mt-1">{formatDate(detailClient.fechaEstimadaImplementacion)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha real</p>
                <p className="mt-1">{formatDate(detailClient.fechaImplementacionReal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Integraciones</p>
                <p className="mt-1">{detailClient.integraciones.join(', ') || 'Sin integraciones'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archivos">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Google Sheet (link)</p>
                    <p className="text-sm text-muted-foreground">Link único por cliente.</p>
                  </div>
                  <div className="w-full md:max-w-[520px]">
                    <Input
                      value={sheetUrlDraft}
                      placeholder="https://docs.google.com/spreadsheets/..."
                      onChange={(e) => setSheetUrlDraft(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const next = sheetUrlDraft.trim()
                      upsertClient({
                        ...detailClient,
                        googleSheetUrl: next ? next : null,
                        updatedAt: new Date().toISOString(),
                      })
                      toast.success('Link de Google Sheet guardado')
                    }}
                    disabled={sheetUrlDraft.trim().length === 0}
                  >
                    Guardar link
                  </Button>
                </div>

                {detailClient.googleSheetUrl ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">Actualmente</p>
                      <a
                        className="block truncate text-sm font-medium text-primary underline"
                        href={detailClient.googleSheetUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {detailClient.googleSheetUrl}
                      </a>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        upsertClient({
                          ...detailClient,
                          googleSheetUrl: null,
                          updatedAt: new Date().toISOString(),
                        })
                        setSheetUrlDraft('')
                        toast.success('Link eliminado')
                      }}
                    >
                      Quitar
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Subir archivo</p>
                    <p className="text-sm text-muted-foreground">Máximo 5MB por archivo · localStorage mock.</p>
                    <input
                      type="file"
                      multiple
                      onChange={(event) => {
                        const files = event.target.files
                        void appendFiles(files).finally(() => {
                          event.currentTarget.value = ''
                        })
                      }}
                    />
                  </div>
                  <div className="space-y-3 rounded-2xl border bg-secondary/10 p-4">
                    <p className="text-sm font-medium">Agregar link</p>
                    <p className="text-sm text-muted-foreground">Drive, Notion, Loom, etc.</p>
                    <Input
                      placeholder="Nombre del link"
                      value={linkNameDraft}
                      onChange={(e) => setLinkNameDraft(e.target.value)}
                    />
                    <Input
                      placeholder="https://..."
                      value={linkUrlDraft}
                      onChange={(e) => setLinkUrlDraft(e.target.value)}
                    />
                    <Button type="button" variant="secondary" onClick={addLinkAsset}>
                      Guardar link
                    </Button>
                  </div>
                </div>

                {detailClient.archivos?.length ? (
                  <div className="space-y-3">
                    {detailClient.archivos.map((asset) => {
                      const isLink = asset.mimeType === 'link' && asset.linkUrl
                      return (
                        <div
                          key={asset.id}
                          className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="flex min-w-0 gap-3">
                            <span className="text-2xl leading-none" aria-hidden>
                              {isLink ? '🔗' : '📄'}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{asset.fileName}</p>
                              <p className="text-sm text-muted-foreground">
                                {isLink ? 'Link externo' : formatBytes(asset.size)} · Subido{' '}
                                {formatDate(asset.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            {isLink ? (
                              <Button variant="outline" size="sm" asChild>
                                <a href={asset.linkUrl} target="_blank" rel="noreferrer">
                                  Abrir
                                </a>
                              </Button>
                            ) : asset.dataUrl ? (
                              <Button variant="outline" size="sm" asChild>
                                <a href={asset.dataUrl} download={asset.fileName}>
                                  Descargar
                                </a>
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled>
                                No disponible
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                removeAsset(asset.id)
                              }}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Todavía no hay archivos ni links para este cliente.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accesos">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle>Accesos y credenciales</CardTitle>
              <Button type="button" onClick={openNewCredential}>
                + Nueva credencial
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <p className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
                Las credenciales se guardan localmente en tu navegador.
              </p>
              {(detailClient.credenciales ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay credenciales guardadas.</p>
              ) : (
                <ul className="space-y-4">
                  {(detailClient.credenciales ?? []).map((c) => {
                    const showPw = revealedCredPw[c.id]
                    return (
                      <li key={c.id} className="rounded-2xl border p-4">
                        <p className="font-semibold">{c.plataforma}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm">{c.usuario}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Copiar usuario"
                            onClick={() => copyToClipboard(c.usuario)}
                          >
                            <Copy className="size-4" />
                          </Button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm">{showPw ? c.contrasena : '••••••••'}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            onClick={() =>
                              setRevealedCredPw((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                            }
                          >
                            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Copiar contraseña"
                            onClick={() => copyToClipboard(c.contrasena)}
                          >
                            <Copy className="size-4" />
                          </Button>
                        </div>
                        {c.notas ? <p className="mt-2 text-sm text-muted-foreground">{c.notas}</p> : null}
                        <div className="mt-3 flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEditCredential(c)}>
                            <Edit3 className="mr-2 size-4" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              deleteCredential(detailClient.id, c.id)
                              toast.success('Credencial eliminada')
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="rounded-2xl border p-4">
                <p className="font-medium">Primer contacto</p>
                <p className="text-sm text-muted-foreground">{formatDate(detailClient.fechaPrimerContacto)}</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="font-medium">Cierre</p>
                <p className="text-sm text-muted-foreground">{formatDate(detailClient.fechaCierre)}</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="font-medium">Último contacto</p>
                <p className="text-sm text-muted-foreground">{formatDate(detailClient.fechaUltimoContacto)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={credDialogOpen} onOpenChange={setCredDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{credentialDraft.id ? 'Editar credencial' : 'Nueva credencial'}</DialogTitle>
            <DialogDescription>Los datos quedan solo en este navegador.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="cred-plat">Plataforma</Label>
              <Input
                id="cred-plat"
                value={credentialDraft.plataforma}
                onChange={(e) => setCredentialDraft((d) => ({ ...d, plataforma: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-user">Usuario</Label>
              <Input
                id="cred-user"
                value={credentialDraft.usuario}
                onChange={(e) => setCredentialDraft((d) => ({ ...d, usuario: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-pass">Contraseña</Label>
              <div className="flex gap-2">
                <Input
                  id="cred-pass"
                  type={showCredPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={credentialDraft.contrasena}
                  onChange={(e) => setCredentialDraft((d) => ({ ...d, contrasena: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Mostrar u ocultar contraseña"
                  onClick={() => setShowCredPassword((v) => !v)}
                >
                  {showCredPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-notes">Notas (opcional)</Label>
              <Textarea
                id="cred-notes"
                value={credentialDraft.notas}
                onChange={(e) => setCredentialDraft((d) => ({ ...d, notas: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setCredDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={saveCredential}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={detailClient}
        users={users}
        onSubmit={(values: ClientFormValues) => {
          upsertClient({
            ...detailClient,
            nombreCliente: values.nombreCliente,
            empresa: values.nombreCliente,
            pais: values.pais || null,
            rubro: values.rubro || null,
            plan: values.plan,
            estadoComercial: values.estadoComercial,
            estadoOperativo: values.estadoOperativo,
            estadoPago: values.estadoPago,
            prioridad: values.prioridad,
            nivelRiesgo: values.nivelRiesgo || null,
            responsablePrincipal: values.responsablePrincipal,
            equipoInvolucrado: [values.responsablePrincipal],
            fechaProximoSeguimiento: values.fechaProximoSeguimiento || null,
            proximaAccion: values.proximaAccion || null,
            notasInternas: values.notasInternas || null,
            updatedAt: now,
          })
          toast.success('Cliente actualizado')
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
