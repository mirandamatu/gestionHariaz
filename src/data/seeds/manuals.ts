import type { ManualAsset } from '@/types/domain'

const now = '2026-03-15T10:00:00.000Z'

export const seedManuals: ManualAsset[] = [
  {
    id: 'manual-whatsapp-campaigns',
    titulo: 'Manual de campanas de WhatsApp',
    descripcion: 'Checklist base para lanzar campanas, medir resultados y evitar errores frecuentes.',
    tipo: 'pdf',
    categoria: 'campanas',
    destacado: true,
    fileName: 'manual-campanas-whatsapp.pdf',
    mimeType: 'application/pdf',
    size: 0,
    linkUrl: 'https://docs.google.com/document/d/manual-campanas-hariaz',
    createdBy: 'ponce',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'manual-onboarding-video',
    titulo: 'Video de onboarding comercial',
    descripcion: 'Video corto para repasar como presentar Basic, Core y Pro.',
    tipo: 'video',
    categoria: 'onboarding',
    destacado: true,
    fileName: 'video-onboarding-comercial',
    mimeType: 'link',
    size: 0,
    linkUrl: 'https://www.loom.com/share/hariaz-onboarding-demo',
    createdBy: 'miranda',
    createdAt: now,
    updatedAt: now,
  },
]
