export type Role = 'superadmin' | 'manager' | 'team_member'

export type ClientStatus = 'active' | 'paused' | 'inactive'
export type ClientHealth = 'healthy' | 'attention' | 'risk'
export type ClientType =
  | 'club_esportiu'
  | 'federacio'
  | 'esdeveniment'
  | 'torneig'
  | 'marca_esportiva'
  | 'esportista'
  | 'mitja'
  | 'empresa'
  | 'altres'

export type ProjectStatus = 'planning' | 'active' | 'at_risk' | 'blocked' | 'completed' | 'archived'
export type ProjectType = 'social_media' | 'content' | 'event' | 'matchday' | 'campaign' | 'reporting' | 'custom'

export type TaskStatus = 'inbox' | 'todo' | 'in_progress' | 'review' | 'blocked' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  avatar_url?: string
  position?: string
  is_active: boolean
  created_at: string
}

export interface Client {
  id: string
  name: string
  slug: string
  type: ClientType
  status: ClientStatus
  health: ClientHealth
  logo_url?: string
  website?: string
  responsible_id?: string
  responsible?: Profile
  description?: string
  contact_name?: string
  contact_position?: string
  contact_email?: string
  contact_phone?: string
  contact_photo_url?: string
  created_at: string
  updated_at: string
  _count?: {
    projects: number
    tasks: number
  }
}

export interface Project {
  id: string
  name: string
  client_id: string
  client?: Client
  type: ProjectType
  status: ProjectStatus
  responsible_id?: string
  responsible?: Profile
  description?: string
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  client_id?: string
  client?: Client
  project_id?: string
  project?: Project
  responsible_id?: string
  responsible?: Profile
  status: TaskStatus
  priority: TaskPriority
  deadline?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface Meeting {
  id: string
  title: string
  client_id?: string
  client?: Client
  project_id?: string
  description?: string
  start_time: string
  end_time: string
  meet_url?: string
  created_by: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  read: boolean
  link?: string
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  user?: Profile
  action: string
  entity_type: string
  entity_id: string
  entity_name: string
  created_at: string
}
