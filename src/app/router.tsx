import { Suspense, lazy, useEffect } from 'react'
import { Navigate, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom'

import { AppShell } from '@/layouts/app-shell'
import { useAuthStore } from '@/store/auth-store'
import { useCrmStore } from '@/store/crm-store'

const DashboardPage = lazy(() =>
  import('@/features/dashboard/dashboard-page').then((module) => ({
    default: module.DashboardPage,
  })),
)
const LoginPage = lazy(() =>
  import('@/features/auth/login-page').then((module) => ({
    default: module.LoginPage,
  })),
)
const ClientsPage = lazy(() =>
  import('@/features/clients/clients-page').then((module) => ({
    default: module.ClientsPage,
  })),
)
const ClientDetailPage = lazy(() =>
  import('@/features/clients/client-detail-page').then((module) => ({
    default: module.ClientDetailPage,
  })),
)
const SalesPipelinePage = lazy(() =>
  import('@/features/pipeline/sales-pipeline-page').then((module) => ({
    default: module.SalesPipelinePage,
  })),
)
const OperationsPipelinePage = lazy(() =>
  import('@/features/pipeline/operations-pipeline-page').then((module) => ({
    default: module.OperationsPipelinePage,
  })),
)
const PaymentsPage = lazy(() =>
  import('@/features/payments/payments-page').then((module) => ({
    default: module.PaymentsPage,
  })),
)
const InteractionsPage = lazy(() =>
  import('@/features/interactions/interactions-page').then((module) => ({
    default: module.InteractionsPage,
  })),
)
const TasksPage = lazy(() =>
  import('@/features/tasks/tasks-page').then((module) => ({
    default: module.TasksPage,
  })),
)
const CalendarPage = lazy(() =>
  import('@/features/calendar/calendar-page').then((module) => ({
    default: module.CalendarPage,
  })),
)
const DemosPage = lazy(() =>
  import('@/features/demos/demos-page').then((module) => ({
    default: module.DemosPage,
  })),
)
const ManualesPage = lazy(() =>
  import('@/features/manuales/manuales-page').then((module) => ({
    default: module.ManualesPage,
  })),
)
const RisksPage = lazy(() =>
  import('@/features/risks/risks-page').then((module) => ({
    default: module.RisksPage,
  })),
)
const ReportsPage = lazy(() =>
  import('@/features/reports/reports-page').then((module) => ({
    default: module.ReportsPage,
  })),
)

function RouteFallback() {
  return (
    <div className="panel flex min-h-[320px] items-center justify-center">
      <p className="text-sm text-muted-foreground">Cargando módulo...</p>
    </div>
  )
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

function ProtectedAppShell() {
  const location = useLocation()
  const initializeCrm = useCrmStore((state) => state.initialize)
  const crmInitialized = useCrmStore((state) => state.initialized)
  const initializeSession = useAuthStore((state) => state.initializeSession)
  const authInitialized = useAuthStore((state) => state.initialized)
  const sessionUserId = useAuthStore((state) => state.sessionUserId)

  useEffect(() => {
    if (!crmInitialized) initializeCrm()
  }, [crmInitialized, initializeCrm])

  useEffect(() => {
    if (crmInitialized && !authInitialized) initializeSession()
  }, [authInitialized, crmInitialized, initializeSession])

  if (!crmInitialized || !authInitialized) {
    return <RouteFallback />
  }

  if (!sessionUserId) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <AppShell />
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
  },
  {
    path: '/',
    element: <ProtectedAppShell />,
    children: [
      { index: true, element: withSuspense(<DashboardPage />) },
      { path: 'clientes', element: withSuspense(<ClientsPage />) },
      { path: 'clientes/:clientId', element: withSuspense(<ClientDetailPage />) },
      { path: 'demos', element: withSuspense(<DemosPage />) },
      { path: 'manuales', element: withSuspense(<ManualesPage />) },
      { path: 'pipeline-comercial', element: withSuspense(<SalesPipelinePage />) },
      { path: 'pipeline-operativo', element: withSuspense(<OperationsPipelinePage />) },
      { path: 'pagos', element: withSuspense(<PaymentsPage />) },
      { path: 'interacciones', element: withSuspense(<InteractionsPage />) },
      { path: 'tareas', element: withSuspense(<TasksPage />) },
      { path: 'calendario', element: withSuspense(<CalendarPage />) },
      { path: 'riesgos', element: withSuspense(<RisksPage />) },
      { path: 'reportes', element: withSuspense(<ReportsPage />) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
