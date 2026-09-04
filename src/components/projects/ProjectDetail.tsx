'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckSquare, Square, Plus, Loader2, ChevronRight,
  Clock, User, AlertCircle, CheckCircle2, Circle, PlayCircle, Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Project, Task, Profile } from '@/types'

/* ── Predefined task templates per campaign type ── */
const TASK_TEMPLATES: Record<string, { title: string; description: string; priority: string }[]> = {
  social_media: [
    { title: 'Briefing i definició d\'estratègia', description: 'Reunió amb el client per definir objectius, públic, to de veu i calendari editorial.', priority: 'high' },
    { title: 'Creació del calendari de continguts', description: 'Planificació mensual de publicacions per a cada xarxa social.', priority: 'high' },
    { title: 'Disseny de peces gràfiques', description: 'Creació de plantilles i peces visuals per les publicacions del mes.', priority: 'medium' },
    { title: 'Redacció de copies', description: 'Redacció dels textos per a cada publicació seguint el to de veu del client.', priority: 'medium' },
    { title: 'Programació de publicacions', description: 'Programar totes les publicacions a les plataformes (Meta, LinkedIn, etc).', priority: 'medium' },
    { title: 'Monitorització i gestió de comunitat', description: 'Resposta de comentaris, DMs i seguiment del engagement.', priority: 'low' },
    { title: 'Informe mensual de resultats', description: 'Elaboració de l\'informe de KPIs: abast, interaccions, seguidors, clics.', priority: 'medium' },
  ],
  content: [
    { title: 'Briefing de contingut', description: 'Definir tema, objectiu, públic i format del contingut a crear.', priority: 'high' },
    { title: 'Recerca i documentació', description: 'Investigació de fonts, dades i referències per al contingut.', priority: 'medium' },
    { title: 'Redacció i creació del contingut', description: 'Producció del contingut (article, vídeo, podcast, infografia...).', priority: 'high' },
    { title: 'Revisió i aprovació del client', description: 'Enviar el contingut al client per a la seva revisió i aprovació.', priority: 'medium' },
    { title: 'Publicació i distribució', description: 'Publicar el contingut als canals acordats.', priority: 'medium' },
    { title: 'Difusió i promoció', description: 'Difondre el contingut per xarxes socials, newsletter i altres canals.', priority: 'low' },
  ],
  event: [
    { title: 'Planificació i logística de l\'event', description: 'Definir data, lloc, format, assistents i necessitats tècniques.', priority: 'high' },
    { title: 'Creació de material gràfic', description: 'Disseny de cartell, banners, invitacions i material visual de l\'event.', priority: 'high' },
    { title: 'Comunicació prèvia i promoció', description: 'Difusió de l\'event per xarxes, email i premsa si escau.', priority: 'medium' },
    { title: 'Gestió d\'inscripcions i assistents', description: 'Control de registres, confirmacions i recordatoris als assistents.', priority: 'medium' },
    { title: 'Cobertura de l\'event en directe', description: 'Publicació de contingut en temps real durant l\'event.', priority: 'high' },
    { title: 'Post-event: resum i contingut', description: 'Elaborar un resum, fotos/vídeos i publicació post-event.', priority: 'medium' },
    { title: 'Informe i valoració final', description: 'Recopilar mètriques, assistència i feedback de l\'event.', priority: 'low' },
  ],
  matchday: [
    { title: 'Contingut pre-partit', description: 'Peces gràfiques i copies d\'escalfament i previsió del partit.', priority: 'high' },
    { title: 'Alineació i onze inicial', description: 'Peça gràfica amb l\'alineació oficial en temps real.', priority: 'high' },
    { title: 'Cobertura en directe', description: 'Publicació de gols, accions destacades i moments clau del partit.', priority: 'urgent' },
    { title: 'Resultat final i resum', description: 'Peça del resultat final i publicació de resum post-partit.', priority: 'high' },
    { title: 'Estadístiques i dades del partit', description: 'Infografia o peça amb les estadístiques destacades.', priority: 'medium' },
    { title: 'Contingut post-partit (reactions)', description: 'Declaracions, cèlebres, moments virals del post-partit.', priority: 'medium' },
  ],
  campaign: [
    { title: 'Definició d\'objectius i KPIs', description: 'Establir els objectius mesurables i els indicadors clau de la campanya.', priority: 'high' },
    { title: 'Estratègia i concepte creatiu', description: 'Definir el concepte, el missatge clau i la línia gràfica de la campanya.', priority: 'high' },
    { title: 'Producció de materials', description: 'Creació de tots els assets de la campanya (gràfics, vídeos, textos).', priority: 'high' },
    { title: 'Configuració de campanyes publicitàries', description: 'Setup de Meta Ads, Google Ads o altres plataformes de pagament.', priority: 'medium' },
    { title: 'Llançament i activació', description: 'Posada en marxa de la campanya en tots els canals.', priority: 'urgent' },
    { title: 'Seguiment i optimització', description: 'Monitorització diària de resultats i ajustos de targeting/pressupost.', priority: 'medium' },
    { title: 'Informe final de campanya', description: 'Resum executiu amb resultats, aprenentatges i recomanacions.', priority: 'medium' },
  ],
  reporting: [
    { title: 'Recollida de dades i mètriques', description: 'Extracció de dades de totes les plataformes (Meta, Google, Analytics...).', priority: 'high' },
    { title: 'Anàlisi de resultats', description: 'Interpretació de les dades i identificació de tendències i insights.', priority: 'high' },
    { title: 'Elaboració de l\'informe', description: 'Maquetació de l\'informe amb gràfics, taules i conclusions.', priority: 'high' },
    { title: 'Revisió interna', description: 'Revisió de l\'informe per l\'equip intern abans d\'enviar al client.', priority: 'medium' },
    { title: 'Presentació al client', description: 'Reunió de presentació de resultats i pròxims passos.', priority: 'medium' },
  ],
  custom: [
    { title: 'Briefing inicial', description: 'Reunió de kick-off per definir abast, objectius i equip.', priority: 'high' },
    { title: 'Planificació i cronograma', description: 'Definir fases, tasques i dates clau del projecte.', priority: 'high' },
    { title: 'Execució', description: 'Desenvolupament de les tasques principals del projecte.', priority: 'medium' },
    { title: 'Revisió i control de qualitat', description: 'Verificació que el treball compleix els estàndards acordats.', priority: 'medium' },
    { title: 'Entrega i tancament', description: 'Lliurament final al client i tancament del projecte.', priority: 'medium' },
  ],
}

const PRIORITY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  urgent: { bg: '#FEF2F2', color: '#DC2626', label: 'Urgent' },
  high:   { bg: '#FFFBEB', color: '#D97706', label: 'Alta' },
  medium: { bg: '#EFF6FF', color: '#4A82C6', label: 'Mitjana' },
  low:    { bg: '#F0F0F0', color: '#9A9A9A', label: 'Baixa' },
}

const STATUS_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  inbox:       { icon: <Circle size={13} />,       label: 'Pendent',    color: '#9A9A9A' },
  todo:        { icon: <Square size={13} />,        label: 'Per fer',    color: '#5C5C5C' },
  in_progress: { icon: <PlayCircle size={13} />,   label: 'En procés',  color: '#4A82C6' },
  review:      { icon: <Eye size={13} />,           label: 'Revisió',    color: '#D97706' },
  blocked:     { icon: <AlertCircle size={13} />,   label: 'Bloquejat',  color: '#DC2626' },
  done:        { icon: <CheckCircle2 size={13} />,  label: 'Fet',        color: '#16A34A' },
}

interface Props {
  project: Project & { client?: { id: string; name: string; type: string } }
  tasks: Task[]
  profiles: { id: string; full_name: string; avatar_url?: string }[]
  currentUser: Profile
}

export function ProjectDetail({ project, tasks: initialTasks, profiles, currentUser }: Props) {
  const router = useRouter()
  const sb = createClient()

  const templates = TASK_TEMPLATES[project.type] || TASK_TEMPLATES.custom
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [creating, setCreating] = useState(false)
  const [assignee, setAssignee] = useState(currentUser.id)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(project.name)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const saveProjectName = async () => {
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === project.name) { setEditingName(false); setNameValue(project.name); return }
    await sb.from('projects').update({ name: trimmed }).eq('id', project.id)
    setEditingName(false)
    router.refresh()
  }

  const existingTitles = new Set(tasks.map(t => t.title.toLowerCase()))
  const pendingTemplates = templates.filter(t => !existingTitles.has(t.title.toLowerCase()))

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === pendingTemplates.length) setSelected(new Set())
    else setSelected(new Set(pendingTemplates.map((_, i) => i)))
  }

  const createSelected = async () => {
    if (selected.size === 0) return
    setCreating(true)
    const toCreate = [...selected].map(i => ({
      title: pendingTemplates[i].title,
      description: pendingTemplates[i].description,
      priority: pendingTemplates[i].priority,
      project_id: project.id,
      client_id: project.client_id,
      responsible_id: assignee || null,
      status: 'todo',
    }))
    const { data, error } = await sb.from('tasks').insert(toCreate).select('*, responsible:profiles(id,full_name,avatar_url)')
    if (!error && data) {
      setTasks(prev => [...prev, ...(data as Task[])])
      setSelected(new Set())
    }
    setCreating(false)
    router.refresh()
  }

  const createOne = async (template: typeof templates[0]) => {
    const { data, error } = await sb.from('tasks').insert({
      title: template.title,
      description: template.description,
      priority: template.priority,
      project_id: project.id,
      client_id: project.client_id,
      responsible_id: assignee || null,
      status: 'todo',
    }).select('*, responsible:profiles(id,full_name,avatar_url)').single()
    if (!error && data) setTasks(prev => [...prev, data as Task])
    router.refresh()
  }

  const typeLabel: Record<string, string> = {
    social_media: 'Social Media', content: 'Contingut', event: 'Event',
    matchday: 'Matchday', campaign: 'Campanya', reporting: 'Reporting', custom: 'Personalitzat',
  }

  return (
    <div className="pd">
      {/* Back link */}
      <Link href="/projects" className="back-link">
        <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} />
        Totes les campanyes
      </Link>

      {/* Project header */}
      <div className="pd-header">
        <div className="pd-meta">
          <span className="pd-type">{typeLabel[project.type] ?? project.type}</span>
          {project.client && <span className="pd-client">{(project.client as any).name}</span>}
        </div>
        {editingName ? (
          <input
            ref={nameInputRef}
            className="pd-title-input"
            value={nameValue}
            autoFocus
            onChange={e => setNameValue(e.target.value)}
            onBlur={saveProjectName}
            onKeyDown={e => { if (e.key === 'Enter') saveProjectName(); if (e.key === 'Escape') { setEditingName(false); setNameValue(project.name) } }}
          />
        ) : (
          <h1 className="pd-title pd-title--editable" onClick={() => { setEditingName(true); setTimeout(() => nameInputRef.current?.focus(), 30) }} title="Clica per editar">
            {nameValue}
          </h1>
        )}
        {project.description && <p className="pd-desc">{project.description}</p>}
      </div>

      <div className="pd-body">
        {/* Left: Tasques predefinides */}
        <div className="col-templates">
          <div className="section-header">
            <div>
              <h2>Tasques per iniciar la campanya</h2>
              <p className="section-sub">{pendingTemplates.length} tasques recomanades per a campanyes de {typeLabel[project.type] ?? project.type}</p>
            </div>
          </div>

          {pendingTemplates.length === 0 ? (
            <div className="all-done">
              <CheckCircle2 size={32} color="#16A34A" strokeWidth={1.5} />
              <p>Totes les tasques recomanades ja estan creades.</p>
            </div>
          ) : (
            <>
              <div className="templates-toolbar">
                <button className="btn-select-all" onClick={toggleAll}>
                  {selected.size === pendingTemplates.length
                    ? <CheckSquare size={14} /> : <Square size={14} />}
                  {selected.size === pendingTemplates.length ? 'Desseleccionar tot' : 'Seleccionar tot'}
                </button>
                <div className="assignee-wrap">
                  <User size={13} color="#9A9A9A" />
                  <select value={assignee} onChange={e => setAssignee(e.target.value)} className="assignee-select">
                    <option value="">Sense assignar</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="templates-list">
                {pendingTemplates.map((t, i) => {
                  const prio = PRIORITY_COLORS[t.priority]
                  const isSel = selected.has(i)
                  return (
                    <div key={i} className={`template-card${isSel ? ' selected' : ''}`}>
                      <button className="template-check" onClick={() => toggle(i)}>
                        {isSel ? <CheckSquare size={16} color="#4A82C6" /> : <Square size={16} color="#D0D0D0" />}
                      </button>
                      <div className="template-body">
                        <div className="template-title">{t.title}</div>
                        <div className="template-desc">{t.description}</div>
                      </div>
                      <div className="template-actions">
                        <span className="prio-badge" style={{ background: prio.bg, color: prio.color }}>
                          {prio.label}
                        </span>
                        <button className="btn-add-one" onClick={() => createOne(t)} title="Afegir aquesta tasca">
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {selected.size > 0 && (
                <div className="create-bar">
                  <span className="create-count">{selected.size} tasca{selected.size !== 1 ? 'ques' : ''} seleccionada{selected.size !== 1 ? 'des' : ''}</span>
                  <button className="btn-create" onClick={createSelected} disabled={creating}>
                    {creating ? <><Loader2 size={13} className="spin" />Creant...</> : <><Plus size={13} />Crear seleccionades</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Tasques existents */}
        <div className="col-tasks">
          <div className="section-header">
            <h2>Tasques de la campanya</h2>
            <span className="task-count">{tasks.length}</span>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-tasks">
              <Clock size={28} color="#D0D0D0" strokeWidth={1.5} />
              <p>Encara no hi ha tasques. Afegeix-ne des de les recomanades.</p>
            </div>
          ) : (
            <div className="tasks-list">
              {tasks.map(task => {
                const statusM = STATUS_META[task.status] || STATUS_META.todo
                const prio = PRIORITY_COLORS[task.priority]
                return (
                  <div key={task.id} className={`task-item${task.status === 'done' ? ' done' : ''}`}>
                    <span style={{ color: statusM.color }}>{statusM.icon}</span>
                    <div className="task-info">
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta-row">
                        <span className="task-status" style={{ color: statusM.color }}>{statusM.label}</span>
                        {(task.responsible as any)?.full_name && (
                          <span className="task-assignee">{(task.responsible as any).full_name}</span>
                        )}
                      </div>
                    </div>
                    <span className="prio-badge sm" style={{ background: prio.bg, color: prio.color }}>
                      {prio.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        :global(.back-link) {
          display: inline-flex; align-items: center; gap: 5px; font-size: 13px; color: #9A9A9A;
          text-decoration: none; font-weight: 500; transition: color 0.15s;
        }
        :global(.back-link:hover) { color: #1B2B4B; }
        .pd { flex: 1; padding: 24px 28px 60px; display: flex; flex-direction: column; gap: 16px; }
        @media (max-width: 768px) { .pd { padding: 16px 12px 80px; } }

        .pd-header { background: white; border: 1px solid #ECECEC; border-radius: 14px; padding: 22px 24px; }
        .pd-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .pd-type { font-size: 11px; font-weight: 700; color: #4A82C6; text-transform: uppercase; letter-spacing: 0.06em; background: #EFF6FF; padding: 3px 8px; border-radius: 5px; }
        .pd-client { font-size: 12px; color: #9A9A9A; }
        .pd-title { font-size: 22px; font-weight: 700; color: #0a0a0a; margin-bottom: 6px; }
        .pd-title--editable { cursor: text; border-radius: 6px; transition: background 0.12s; }
        .pd-title--editable:hover { background: rgba(0,0,0,0.04); }
        .pd-title-input {
          font-size: 22px; font-weight: 700; color: #0a0a0a;
          border: none; border-bottom: 2px solid #2563EB; background: transparent;
          outline: none; font-family: inherit; width: 100%; margin-bottom: 6px;
          padding: 0 0 2px; letter-spacing: -0.01em;
        }
        .pd-desc { font-size: 14px; color: #5C5C5C; line-height: 1.5; }

        .pd-body { display: grid; grid-template-columns: 1fr 380px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .pd-body { grid-template-columns: 1fr; } }
        @media (max-width: 767px) { .col-tasks { position: relative; top: auto; } }

        /* Templates column */
        .col-templates { display: flex; flex-direction: column; gap: 14px; }
        .col-tasks { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 80px; }

        .section-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .section-header h2 { font-size: 15px; font-weight: 700; color: #0a0a0a; }
        .section-sub { font-size: 12px; color: #9A9A9A; margin-top: 3px; }
        .task-count { font-size: 12px; font-weight: 700; color: #9A9A9A; background: #F0F0F0; padding: 2px 8px; border-radius: 10px; }

        .templates-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .btn-select-all { display: flex; align-items: center; gap: 6px; border: 1px solid #E8E8E8; background: white; border-radius: 7px; padding: 6px 12px; font-size: 13px; color: #5C5C5C; cursor: pointer; font-family: inherit; }
        .btn-select-all:hover { border-color: #D0D0D0; color: #0a0a0a; }
        .assignee-wrap { display: flex; align-items: center; gap: 6px; }
        .assignee-select { height: 32px; padding: 0 8px; border: 1px solid #E8E8E8; border-radius: 7px; font-size: 13px; color: #0a0a0a; background: white; outline: none; font-family: inherit; cursor: pointer; }
        .assignee-select:focus { border-color: #4A82C6; }

        .templates-list { display: flex; flex-direction: column; gap: 8px; }
        .template-card {
          display: flex; align-items: flex-start; gap: 12px;
          background: white; border: 1.5px solid #ECECEC; border-radius: 12px;
          padding: 14px 16px; transition: all 0.15s; cursor: default;
        }
        .template-card:hover { border-color: #D0D8E8; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .template-card.selected { border-color: #4A82C6; background: #F0F6FF; }
        .template-check { border: none; background: none; cursor: pointer; padding: 0; flex-shrink: 0; padding-top: 1px; }
        .template-body { flex: 1; min-width: 0; }
        .template-title { font-size: 13.5px; font-weight: 600; color: #0a0a0a; margin-bottom: 4px; }
        .template-desc { font-size: 12.5px; color: #5C5C5C; line-height: 1.5; }
        .template-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
        .prio-badge { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 4px; white-space: nowrap; }
        .prio-badge.sm { font-size: 10px; padding: 2px 6px; }
        .btn-add-one { width: 26px; height: 26px; border: 1px solid #E8E8E8; border-radius: 6px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #9A9A9A; transition: all 0.15s; }
        .btn-add-one:hover { border-color: #4A82C6; color: #4A82C6; }

        .create-bar { display: flex; align-items: center; justify-content: space-between; background: #1B2B4B; border-radius: 10px; padding: 12px 16px; gap: 12px; }
        .create-count { font-size: 13px; font-weight: 600; color: white; }
        .btn-create { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; background: #4A82C6; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s; }
        .btn-create:hover:not(:disabled) { background: #3A6FB5; }
        .btn-create:disabled { opacity: 0.6; cursor: not-allowed; }

        .all-done { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px; color: #16A34A; background: #F0FDF4; border-radius: 12px; border: 1px solid #BBF7D0; }
        .all-done p { font-size: 14px; font-weight: 500; }

        /* Tasks column */
        .empty-tasks { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 20px; color: #9A9A9A; font-size: 13.5px; background: white; border: 1px solid #ECECEC; border-radius: 12px; }
        .tasks-list { display: flex; flex-direction: column; gap: 6px; }
        .task-item { display: flex; align-items: flex-start; gap: 10px; background: white; border: 1px solid #ECECEC; border-radius: 10px; padding: 12px 14px; transition: background 0.1s; }
        .task-item:hover { background: #FAFAFA; }
        .task-item.done { opacity: 0.55; }
        .task-info { flex: 1; min-width: 0; }
        .task-title { font-size: 13.5px; font-weight: 600; color: #0a0a0a; margin-bottom: 3px; }
        .task-meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .task-status { font-size: 11.5px; font-weight: 500; }
        .task-assignee { font-size: 11.5px; color: #9A9A9A; }

        :global(.spin) { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
