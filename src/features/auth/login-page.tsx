import { LockKeyhole } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAuthStore } from '@/store/auth-store'
import { useCrmStore } from '@/store/crm-store'

export function LoginPage() {
  const initializeCrm = useCrmStore((state) => state.initialize)
  const crmInitialized = useCrmStore((state) => state.initialized)
  const users = useCrmStore((state) => state.users)
  const initializeSession = useAuthStore((state) => state.initializeSession)
  const authInitialized = useAuthStore((state) => state.initialized)
  const sessionUserId = useAuthStore((state) => state.sessionUserId)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()

  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!crmInitialized) initializeCrm()
  }, [crmInitialized, initializeCrm])

  useEffect(() => {
    if (crmInitialized && !authInitialized) initializeSession()
  }, [authInitialized, crmInitialized, initializeSession])

  useEffect(() => {
    if (!userId && users[0]?.id) setUserId(users[0].id)
  }, [userId, users])

  const redirectTo = useMemo(() => {
    const from = location.state as { from?: string } | null
    return from?.from || '/'
  }, [location.state])

  if (authInitialized && sessionUserId) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <img src="/hariaz-logo.png" alt="Hariaz" className="mx-auto h-20 w-auto max-w-[260px] object-contain" />
          <div>
            <CardTitle className="text-2xl">Ingresar a Hariaz CRM</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Seleccioná tu usuario del equipo y usá la contraseña compartida local.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-user">Usuario</Label>
            <Select id="login-user" value={userId} onChange={(event) => setUserId(event.target.value)}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre} · {user.email}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Contraseña</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              autoComplete="current-password"
              placeholder="Ingresá la contraseña"
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                const result = login(userId, password)
                if (!result.ok) {
                  toast.error(result.message)
                  return
                }
                toast.success('Sesión iniciada')
                navigate(redirectTo, { replace: true })
              }}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => {
              const result = login(userId, password)
              if (!result.ok) {
                toast.error(result.message)
                return
              }
              toast.success('Sesión iniciada')
              navigate(redirectTo, { replace: true })
            }}
            disabled={!userId || !password.trim()}
          >
            <LockKeyhole className="size-4" />
            Iniciar sesión
          </Button>

          <div className="rounded-2xl border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
            Contraseña inicial del equipo: <span className="font-medium text-foreground">Hariaz2026!!</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
