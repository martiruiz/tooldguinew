import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatTime(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
}

export function formatRelative(date: string | Date) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Ara mateix'
  if (minutes < 60) return `Fa ${minutes}m`
  if (hours < 24) return `Fa ${hours}h`
  if (days === 1) return 'Ahir'
  return formatDate(d)
}

export const clientTypeLabels: Record<string, string> = {
  club_esportiu: 'Club esportiu',
  federacio: 'Federació',
  esdeveniment: 'Esdeveniment',
  torneig: 'Torneig',
  marca_esportiva: 'Marca esportiva',
  esportista: 'Esportista',
  mitja: 'Mitjà',
  empresa: 'Empresa',
  altres: 'Altres',
}

export const projectTypeLabels: Record<string, string> = {
  social_media: 'Social Media',
  content: 'Content',
  event: 'Event',
  matchday: 'Matchday',
  campaign: 'Campanya',
  reporting: 'Reporting',
  custom: 'Custom',
}

export const projectStatusLabels: Record<string, string> = {
  planning: 'Planning',
  active: 'Actiu',
  at_risk: 'En risc',
  blocked: 'Bloquejat',
  completed: 'Completat',
  archived: 'Arxivat',
}

export const taskStatusLabels: Record<string, string> = {
  inbox: 'Inbox',
  todo: 'Per fer',
  in_progress: 'En curs',
  review: 'Revisió',
  blocked: 'Bloquejat',
  done: 'Fet',
}

export const taskPriorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Mitja',
  high: 'Alta',
  urgent: 'Urgent',
}

export const roleLabels: Record<string, string> = {
  superadmin: 'Superadmin',
  manager: 'Manager',
  team_member: 'Team Member',
}

export const healthLabels: Record<string, string> = {
  healthy: 'Healthy',
  attention: 'Attention',
  risk: 'Risk',
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}
