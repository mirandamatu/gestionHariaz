import { BookOpen, Link as LinkIcon, PlayCircle, Star, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/formatters'
import { useCrmStore } from '@/store/crm-store'
import type { ManualAsset, ManualCategory, ManualType } from '@/types/domain'

const MAX_MANUAL_BYTES = 5 * 1024 * 1024

const MANUAL_CATEGORIES: ManualCategory[] = ['ventas', 'onboarding', 'operacion', 'campanas', 'soporte', 'interno']

function resolveManualType(file: File): ManualType {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('video/')) return 'video'
  return 'archivo'
}

function typeLabel(tipo: ManualType) {
  return {
    pdf: 'PDF',
    video: 'Video',
    link: 'Link',
    archivo: 'Archivo',
  }[tipo]
}

function categoryLabel(category: ManualCategory) {
  return {
    ventas: 'Ventas',
    onboarding: 'Onboarding',
    operacion: 'Operación',
    campanas: 'Campañas',
    soporte: 'Soporte',
    interno: 'Interno',
  }[category]
}

export function ManualesPage() {
  const manuals = useCrmStore((state) => state.manuals)
  const users = useCrmStore((state) => state.users)
  const activeUserId = useCrmStore((state) => state.activeUserId)
  const upsertManual = useCrmStore((state) => state.upsertManual)
  const deleteManual = useCrmStore((state) => state.deleteManual)

  const [query, setQuery] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'all' | ManualType>('all')
  const [categoriaFiltro, setCategoriaFiltro] = useState<'all' | ManualCategory>('all')
  const [soloDestacados, setSoloDestacados] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [manualDraft, setManualDraft] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'link' as ManualType,
    categoria: 'interno' as ManualCategory,
    linkUrl: '',
    destacado: false,
  })

  const filteredManuals = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return manuals.filter((manual) => {
      const matchesType = tipoFiltro === 'all' || manual.tipo === tipoFiltro
      const matchesCategory = categoriaFiltro === 'all' || manual.categoria === categoriaFiltro
      const matchesFeatured = !soloDestacados || manual.destacado
      const haystack = [manual.titulo, manual.descripcion ?? '', manual.fileName, manual.categoria].join(' ').toLowerCase()
      const matchesQuery = !normalized || haystack.includes(normalized)
      return matchesType && matchesCategory && matchesFeatured && matchesQuery
    })
  }, [categoriaFiltro, manuals, query, soloDestacados, tipoFiltro])

  const featuredManuals = useMemo(() => manuals.filter((manual) => manual.destacado).slice(0, 3), [manuals])

  async function appendFiles(files: FileList | null) {
    if (!files) return
    const allowed = Array.from(files).filter((file) => file.size <= MAX_MANUAL_BYTES)
    const omitted = Array.from(files).length - allowed.length
    if (omitted > 0) {
      toast.error(`Se omitieron ${omitted} archivo(s) por superar 5MB. Para videos grandes usa un link.`)
    }
    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
        reader.readAsDataURL(file)
      })

    const ts = new Date().toISOString()
    const createdBy = activeUserId || users[0]?.id || 'ponce'

    for (const file of allowed) {
      const manual: ManualAsset = {
        id: crypto.randomUUID(),
        titulo: file.name.replace(/\.[^.]+$/, ''),
        descripcion: null,
        tipo: resolveManualType(file),
        categoria: manualDraft.categoria,
        destacado: manualDraft.destacado,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: await toDataUrl(file),
        createdBy,
        createdAt: ts,
        updatedAt: ts,
      }
      upsertManual(manual)
    }

    if (allowed.length) toast.success(`${allowed.length} manual(es) cargado(s)`)
  }

  function saveLinkManual() {
    const titulo = manualDraft.titulo.trim()
    const linkUrl = manualDraft.linkUrl.trim()
    if (!titulo || !linkUrl) {
      toast.error('Completá el título y la URL del manual')
      return
    }
    const ts = new Date().toISOString()
    upsertManual({
      id: crypto.randomUUID(),
      titulo,
      descripcion: manualDraft.descripcion.trim() || null,
      tipo: manualDraft.tipo,
      categoria: manualDraft.categoria,
      destacado: manualDraft.destacado,
      fileName: titulo,
      mimeType: 'link',
      size: 0,
      linkUrl,
      createdBy: activeUserId || users[0]?.id || 'ponce',
      createdAt: ts,
      updatedAt: ts,
    })
    toast.success('Manual guardado')
    setDialogOpen(false)
    setManualDraft({ titulo: '', descripcion: '', tipo: 'link', categoria: 'interno', linkUrl: '', destacado: false })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Biblioteca"
        title="Manuales"
        description="Biblioteca interna para ventas, onboarding, operación y soporte. Todo ordenado por tipo y uso real."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <BookOpen className="size-4" />
            + Nuevo manual
          </Button>
        }
      />

      {featuredManuals.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {featuredManuals.map((manual) => (
            <Card key={manual.id} className="border-amber-200 bg-amber-50/60">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{manual.titulo}</p>
                    <p className="text-sm text-muted-foreground">{categoryLabel(manual.categoria)}</p>
                  </div>
                  <Star className="size-4 fill-amber-400 text-amber-500" />
                </div>
                {manual.descripcion ? <p className="text-sm text-muted-foreground">{manual.descripcion}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_170px_180px_auto]">
          <Input
            placeholder="Buscar por título, descripción, categoría o archivo..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value as 'all' | ManualType)}>
            <option value="all">Todos los tipos</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="link">Link</option>
            <option value="archivo">Archivo</option>
          </Select>
          <Select value={categoriaFiltro} onChange={(event) => setCategoriaFiltro(event.target.value as 'all' | ManualCategory)}>
            <option value="all">Todas las categorías</option>
            {MANUAL_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm">
            <input type="checkbox" checked={soloDestacados} onChange={(event) => setSoloDestacados(event.target.checked)} />
            Solo destacados
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filteredManuals.map((manual) => {
          const author = users.find((user) => user.id === manual.createdBy)?.nombre ?? manual.createdBy
          const isExternal = Boolean(manual.linkUrl)
          return (
            <Card key={manual.id}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{manual.titulo}</CardTitle>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge className="border-muted-foreground/30 bg-muted text-muted-foreground">
                      {typeLabel(manual.tipo)}
                    </Badge>
                    <Badge className="border-muted-foreground/30 bg-muted text-muted-foreground">
                      {categoryLabel(manual.categoria)}
                    </Badge>
                  </div>
                </div>
                {manual.descripcion ? <p className="text-sm text-muted-foreground">{manual.descripcion}</p> : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Cargado por {author}</p>
                  <p>{formatDate(manual.createdAt)}</p>
                  {manual.destacado ? <p className="mt-1 font-medium text-amber-700">Manual destacado</p> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {isExternal ? (
                    <Button variant="outline" asChild>
                      <a href={manual.linkUrl} target="_blank" rel="noreferrer">
                        {manual.tipo === 'video' ? <PlayCircle className="size-4" /> : <LinkIcon className="size-4" />}
                        Abrir
                      </a>
                    </Button>
                  ) : manual.dataUrl ? (
                    <Button variant="outline" asChild>
                      <a href={manual.dataUrl} download={manual.fileName}>
                        Descargar
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      deleteManual(manual.id)
                      toast.success('Manual eliminado')
                    }}
                  >
                    <Trash2 className="size-4" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredManuals.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No hay manuales que coincidan con los filtros.
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo manual</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6">
            <div className="grid gap-3 rounded-2xl border p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={manualDraft.categoria}
                    onChange={(event) => setManualDraft((prev) => ({ ...prev, categoria: event.target.value as ManualCategory }))}
                  >
                    {MANUAL_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {categoryLabel(category)}
                      </option>
                    ))}
                  </Select>
                </div>
                <label className="flex items-end gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={manualDraft.destacado}
                    onChange={(event) => setManualDraft((prev) => ({ ...prev, destacado: event.target.checked }))}
                  />
                  Marcar como destacado
                </label>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <div>
                <p className="font-medium">Subir archivo</p>
                <p className="text-sm text-muted-foreground">
                  PDF o archivo liviano. Para videos grandes conviene pegar un link.
                </p>
              </div>
              <Input
                type="file"
                multiple
                onChange={(event) => {
                  void appendFiles(event.target.files).finally(() => {
                    event.currentTarget.value = ''
                  })
                }}
              />
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <div>
                <p className="font-medium">Agregar link o video</p>
                <p className="text-sm text-muted-foreground">Ideal para Loom, Drive, Notion o videos externos.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-title">Título</Label>
                <Input
                  id="manual-title"
                  value={manualDraft.titulo}
                  onChange={(event) => setManualDraft((prev) => ({ ...prev, titulo: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-type">Tipo</Label>
                <Select
                  id="manual-type"
                  value={manualDraft.tipo}
                  onChange={(event) => setManualDraft((prev) => ({ ...prev, tipo: event.target.value as ManualType }))}
                >
                  <option value="link">Link</option>
                  <option value="video">Video</option>
                  <option value="pdf">PDF externo</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-url">URL</Label>
                <Input
                  id="manual-url"
                  value={manualDraft.linkUrl}
                  placeholder="https://..."
                  onChange={(event) => setManualDraft((prev) => ({ ...prev, linkUrl: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-description">Descripción</Label>
                <Textarea
                  id="manual-description"
                  rows={3}
                  value={manualDraft.descripcion}
                  onChange={(event) => setManualDraft((prev) => ({ ...prev, descripcion: event.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveLinkManual}>Guardar manual</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
