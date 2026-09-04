'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, FolderKanban, Clock } from 'lucide-react'
import { cn, projectStatusLabels, projectTypeLabels, getInitials, formatDate, clientTypeLabels } from '@/lib/utils'
import { NewProjectModal } from '@/components/projects/NewProjectModal'
import type { Project } from '@/types'

function NewCampaignModal({ clients, profiles, onClose, onCreated }: {
  clients: { id: string; name: string }[]
  profiles: { id: string; full_name: string }[]
  onClose: () => void
  onCreated: (p: Project) => void
}) {
  return (
    <NewProjectModal
      clients={clients}
      profiles={profiles}
      onClose={onClose}
      onCreated={onCreated as any}
    />
  )
}

const statusColors: Record<string, { bg: string; color: string }> = {
  planning: { bg: '#F0F0F0', color: '#5C5C5C' },
  active: { bg: '#F0FDF4', color: '#16A34A' },
  at_risk: { bg: '#FFFBEB', color: '#D97706' },
  blocked: { bg: '#FEF2F2', color: '#DC2626' },
  completed: { bg: '#EFF6FF', color: '#1B2B4B' },
  archived: { bg: '#F5F5F5', color: '#9A9A9A' },
}

const typeColors: Record<string, string> = {
  social_media: '#E879F9',
  content: '#0EA5E9',
  event: '#F97316',
  matchday: '#DC2626',
  campaign: '#D97706',
  reporting: '#6366F1',
  custom: '#9A9A9A',
}

const statusFilters = ['Tots', 'Planning', 'Actius', 'En risc', 'Bloquejats', 'Completats']
const statusFilterMap: Record<string, string> = {
  Planning: 'planning', Actius: 'active', 'En risc': 'at_risk',
  Bloquejats: 'blocked', Completats: 'completed',
}

interface Props {
  projects: Project[]
  clients: { id: string; name: string }[]
  profiles: { id: string; full_name: string }[]
  userRole?: string
}

export function ProjectsContent({ projects, clients, profiles, userRole }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tots')
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [localProjects, setLocalProjects] = useState(projects)

  const filtered = localProjects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.client as any)?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filter === 'Tots' || p.status === statusFilterMap[filter]
    return matchSearch && matchStatus
  })

  const canCreate = userRole === 'superadmin' || userRole === 'manager'

  return (
    <div className="projects-page">
      <div className="projects-toolbar">
        <div className="search-wrap">
          <Search size={14} color="#9A9A9A" />
          <input
            type="text"
            placeholder="Buscar projecte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('filter-btn', filter === f && 'filter-btn--active')}
            >
              {f}
            </button>
          ))}
        </div>

        <button className="btn-primary" onClick={() => setShowNewCampaign(true)}>
          <Plus size={14} strokeWidth={2.5} />
          Nou projecte
        </button>
      </div>

      <div className="count">{filtered.length} campanyes</div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={32} color="#D0D0D0" />
          <p>Cap projecte trobat.</p>
          <button className="btn-primary" style={{ marginTop: '12px' }} onClick={() => setShowNewCampaign(true)}>
            <Plus size={14} strokeWidth={2.5} />
            Nou projecte
          </button>
        </div>
      ) : (
        <div className="projects-list">
          {filtered.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}

      {showNewCampaign && (
        <NewCampaignModal
          clients={clients}
          profiles={profiles}
          onClose={() => setShowNewCampaign(false)}
          onCreated={(p) => {
            setLocalProjects(prev => [p, ...prev])
            setShowNewCampaign(false)
          }}
        />
      )}

      <style jsx>{`
        .projects-page {
          flex: 1;
          padding: 24px 28px 40px;
        }

        @media (max-width: 767px) {
          .projects-page { padding: 12px 12px 80px; }
          .search-wrap { flex: 1; max-width: 100%; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .projects-page { padding: 16px 16px 40px; }
        }

        .projects-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 13px;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          background: white;
          flex: 1;
          min-width: 200px;
          max-width: 300px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .search-wrap:focus-within {
          border-color: rgba(37,99,235,0.3);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 13.5px;
          color: #0F1B2D;
          background: transparent;
        }

        .search-input::placeholder { color: #C8D0DC; }

        .filters {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .filter-btn {
          height: 36px;
          padding: 0 13px;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          font-size: 13px;
          color: #5C6B80;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          font-weight: 500;
        }

        .filter-btn:hover { border-color: rgba(0,0,0,0.14); color: #0F1B2D; box-shadow: 0 2px 6px rgba(0,0,0,0.08); transform: translateY(-1px); }

        .filter-btn--active {
          background: linear-gradient(135deg, #1B2B4B, #2563EB);
          border-color: transparent;
          color: white;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(37,99,235,0.25);
        }

        .filter-btn--active:hover { background: linear-gradient(135deg, #0F1E33, #1D4ED8); color: white; transform: translateY(-1px); }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          background: linear-gradient(135deg, #1B2B4B, #2563EB);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
        }

        .btn-primary:hover { background: linear-gradient(135deg, #0F1E33, #1D4ED8); box-shadow: 0 4px 14px rgba(37,99,235,0.38); transform: translateY(-1px); }

        .count {
          font-size: 12.5px;
          color: #A0A9BB;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 24px;
          color: #9A9A9A;
          font-size: 14px;
        }

        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </div>
  )
}

function ProjectRow({ project }: { project: Project }) {
  const badge = statusColors[project.status] || statusColors.planning
  const typeColor = typeColors[project.type] || '#9A9A9A'
  const client = project.client as any
  const responsible = project.responsible as any

  return (
    <Link href={`/projects/${project.id}`} className="project-row">
      <div className="project-type-dot" style={{ background: typeColor }} />

      <div className="project-main">
        <div className="project-name">{project.name}</div>
        {client && (
          <div className="project-client">
            <div className="client-avatar-sm">
              {client.logo_url ? (
                <img src={client.logo_url} alt={client.name} />
              ) : (
                getInitials(client.name)
              )}
            </div>
            {client.name}
          </div>
        )}
      </div>

      <div className="project-type-badge" style={{ color: typeColor, background: `${typeColor}14` }}>
        {projectTypeLabels[project.type]}
      </div>

      <span className="project-status" style={{ background: badge.bg, color: badge.color }}>
        {projectStatusLabels[project.status]}
      </span>

      {responsible && (
        <div className="project-resp">
          <div className="resp-avatar">{getInitials(responsible.full_name)}</div>
          <span className="resp-name">{responsible.full_name}</span>
        </div>
      )}

      {project.end_date && (
        <div className="project-date">
          <Clock size={11} />
          {formatDate(project.end_date)}
        </div>
      )}

      <style jsx>{`
        :global(.project-row) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 20px;
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 18px;
          text-decoration: none;
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
          flex-wrap: wrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
        }

        :global(.project-row:hover) {
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
          border-color: rgba(37,99,235,0.15);
          transform: translateY(-1px);
        }

        .project-type-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .project-main { flex: 1; min-width: 0; }

        .project-name {
          font-size: 14px;
          font-weight: 600;
          color: #0F1B2D;
        }

        .project-client {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #8896A8;
          margin-top: 3px;
        }

        .client-avatar-sm {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          background: #F0F0F0;
          font-size: 7px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .client-avatar-sm img { width: 100%; height: 100%; object-fit: contain; }

        .project-type-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 5px;
          white-space: nowrap;
        }

        .project-status {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 5px;
          white-space: nowrap;
        }

        .project-resp {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #5C5C5C;
        }

        .resp-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B6FD4, #1B2B4B);
          color: white;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .resp-name {
          white-space: nowrap;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #5C6B80;
          font-size: 12.5px;
        }

        .project-date {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #A0A9BB;
          white-space: nowrap;
        }
      `}</style>
    </Link>
  )
}
