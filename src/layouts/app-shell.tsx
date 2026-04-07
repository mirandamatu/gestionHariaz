import { Bell, CalendarClock, ClipboardList, LogOut, PanelLeft, Search, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { navigationItems } from '@/config/navigation'
import { PROFILE_COPY } from '@/lib/constants'
import { countMeetingInteractionsWithOpenTodosOnDate, localDateKey } from '@/lib/briefing'
import { buildPipelineSearchResults } from '@/lib/pipeline-search'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { useCrmStore } from '@/store/crm-store'
import { useUiStore } from '@/store/ui-store'

export function AppShell() {
  const users = useCrmStore((state) => state.users)
  const clients = useCrmStore((state) => state.clients)
  const tasks = useCrmStore((state) => state.tasks)
  const interactions = useCrmStore((state) => state.interactions)
  const activeUserId = useCrmStore((state) => state.activeUserId)
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)

  const activeUser = users.find((user) => user.id === activeUserId) ?? users[0]
  const profileCopy = activeUser ? PROFILE_COPY[activeUser.perfilPreferido] : PROFILE_COPY.ventas

  const prioritizedItems = useMemo(() => {
    const priorities = new Set(profileCopy.quickLinks)
    const featured = navigationItems.filter((item) => priorities.has(item.title))
    const rest = navigationItems.filter((item) => !priorities.has(item.title))
    return [...featured, ...rest]
  }, [profileCopy.quickLinks])

  const todayKey = useMemo(() => localDateKey(new Date()), [])

  const taskBadgeCount = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (t.estado === 'pendiente' || t.estado === 'en_progreso') && t.asignadoA === activeUserId,
      ).length,
    [activeUserId, tasks],
  )

  const calendarBadgeCount = useMemo(
    () => countMeetingInteractionsWithOpenTodosOnDate(interactions, todayKey),
    [interactions, todayKey],
  )

  const urgentFollowUps = useMemo(
    () => clients.filter((client) => client.fechaProximoSeguimiento && client.fechaProximoSeguimiento <= todayKey).length,
    [clients, todayKey],
  )

  const pipelineResults = useMemo(
    () => buildPipelineSearchResults(clients, users, searchQuery),
    [clients, searchQuery, users],
  )

  function openClientDetail(clientId: string) {
    setSearchQuery('')
    setShowResults(false)
    navigate(`/clientes/${clientId}`)
  }

  function openPipeline(pipeline: 'commercial' | 'operational') {
    setSearchQuery('')
    setShowResults(false)
    navigate(pipeline === 'commercial' ? '/pipeline-comercial' : '/pipeline-operativo')
  }

  return (
    <div className="min-h-screen p-3 lg:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className={cn(
            'panel subtle-grid flex flex-col gap-6 overflow-hidden p-5 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]',
            !sidebarOpen && 'hidden lg:flex',
          )}
        >
          <div className="flex items-center gap-3">
            <img src="/hariaz-logo.png" alt="Hariaz" className="h-10 w-auto max-w-[160px] object-contain" />
            <div>
              <p className="text-lg font-semibold">Hariaz CRM</p>
              <p className="text-sm text-muted-foreground">Centro operativo del equipo</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-2">
            <div className="rounded-3xl border bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Sesión activa
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar>{activeUser?.nombre.slice(0, 2).toUpperCase()}</Avatar>
                <div>
                  <p className="font-medium">{activeUser?.nombre ?? 'Cargando'}</p>
                  <p className="text-sm text-muted-foreground">{profileCopy.title}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border bg-secondary/30 p-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="size-4 text-primary" />
                  {activeUser?.email ?? 'Sin email'}
                </div>
                <p className="mt-1 text-muted-foreground">
                  Acceso local mock. Tu sesión queda guardada en este navegador.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => {
                  logout()
                  navigate('/login', { replace: true })
                }}
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </Button>
            </div>

            <div className="grid gap-3 rounded-3xl border bg-white/70 p-4">
              <div className="flex items-center justify-between rounded-2xl border p-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Mis tareas</p>
                  <p className="text-2xl font-semibold">{taskBadgeCount}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/tareas?view=mine')}>
                  Abrir
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-2xl border p-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Seguimientos urgentes</p>
                  <p className="text-2xl font-semibold">{urgentFollowUps}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/clientes?focus=seguimientos')}>
                  Ver
                </Button>
              </div>
            </div>

            <nav className="space-y-2">
              {prioritizedItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-white hover:text-foreground',
                        isActive && 'bg-white text-foreground shadow-sm',
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1">{item.title}</span>
                    {item.path === '/tareas' && taskBadgeCount > 0 ? (
                      <Badge className="shrink-0 border-transparent bg-destructive px-2 py-0 text-xs tabular-nums text-destructive-foreground">
                        {taskBadgeCount}
                      </Badge>
                    ) : null}
                    {item.path === '/calendario' && calendarBadgeCount > 0 ? (
                      <Badge className="shrink-0 border-transparent bg-destructive px-2 py-0 text-xs tabular-nums text-destructive-foreground">
                        {calendarBadgeCount}
                      </Badge>
                    ) : null}
                  </NavLink>
                )
              })}
            </nav>
          </div>

        </aside>

        <main className="space-y-4">
          <header className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <PanelLeft className="size-4" />
              </Button>
              <div className="relative w-full lg:w-[420px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value)
                    setShowResults(true)
                  }}
                  onFocus={() => setShowResults(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowResults(false), 120)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && pipelineResults[0]) {
                      event.preventDefault()
                      openClientDetail(pipelineResults[0].clientId)
                    }
                  }}
                  className="h-11 pl-10 pr-4"
                  placeholder="Buscar cliente, etapa, responsable o próxima acción..."
                />
                {showResults && searchQuery.trim() ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border bg-white p-2 shadow-soft">
                    {pipelineResults.length ? (
                      pipelineResults.map((result) => (
                        <div
                          key={result.clientId}
                          className="rounded-2xl px-3 py-3 transition hover:bg-secondary/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{result.clientName}</p>
                              <p className="text-sm text-muted-foreground">
                                {result.pipelineLabel} · {result.statusLabel}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Responsable: {result.responsable} · {result.plan}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Próxima acción: {result.proximaAccion}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Pago: {result.estadoPago} · Riesgo: {result.riesgo}
                              </p>
                            </div>
                            <Badge className="border-muted-foreground/30 bg-muted text-muted-foreground">
                              {result.pipelinePrincipal === 'commercial' ? 'Comercial' : 'Operativo'}
                            </Badge>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => openPipeline(result.pipelinePrincipal)}
                            >
                              Ver pipeline
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => openClientDetail(result.clientId)}
                            >
                              Abrir ficha
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-muted-foreground">
                        No se encontraron clientes con ese texto.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-2xl border bg-white/70 px-3 py-2 text-sm lg:flex">
                <ClipboardList className="size-4 text-primary" />
                <button type="button" className="font-medium" onClick={() => navigate('/tareas?view=mine')}>
                  {taskBadgeCount} abiertas
                </button>
              </div>
              <div className="hidden items-center gap-2 rounded-2xl border bg-white/70 px-3 py-2 text-sm lg:flex">
                <CalendarClock className="size-4 text-primary" />
                <button
                  type="button"
                  className="font-medium"
                  onClick={() => navigate('/calendario')}
                >
                  {calendarBadgeCount} reuniones
                </button>
              </div>
              <div className="hidden text-right lg:block">
                <p className="text-sm font-medium">{activeUser?.nombre ?? 'Equipo'}</p>
                <p className="text-xs text-muted-foreground">{profileCopy.title}</p>
              </div>
              <Button variant="outline" size="icon" onClick={() => navigate('/clientes?focus=seguimientos')}>
                <Bell className="size-4" />
              </Button>
            </div>
          </header>

          <div className="min-h-[calc(100vh-9rem)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
