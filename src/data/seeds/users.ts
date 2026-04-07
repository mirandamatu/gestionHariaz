import type { User } from '@/types/domain'

const now = '2026-03-15T10:00:00.000Z'
const teamPassword = 'Hariaz2026!!'

export const seedUsers: User[] = [
  {
    id: 'ponce',
    nombre: 'Ponce',
    email: 'ponce@hariaz.com',
    password: teamPassword,
    perfilPreferido: 'ventas',
    esAdmin: true,
    activo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'quinte',
    nombre: 'Quinte',
    email: 'quinte@hariaz.com',
    password: teamPassword,
    perfilPreferido: 'desarrollo',
    esAdmin: true,
    activo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ezequias',
    nombre: 'Ezequias',
    email: 'ezequias@hariaz.com',
    password: teamPassword,
    perfilPreferido: 'ventas',
    esAdmin: true,
    activo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'miranda',
    nombre: 'Miranda',
    email: 'miranda@hariaz.com',
    password: teamPassword,
    perfilPreferido: 'customer_success',
    esAdmin: true,
    activo: true,
    createdAt: now,
    updatedAt: now,
  },
]
