export type Lang = 'ca' | 'es' | 'en'

type TranslationMap = Record<string, Record<Lang, string>>

export const TRANSLATIONS: TranslationMap = {
  // Greetings
  greetMorning:   { ca: 'Bon dia 👋',   es: 'Buenos días 👋',    en: 'Good morning 👋' },
  greetAfternoon: { ca: 'Bona tarda 👋', es: 'Buenas tardes 👋',  en: 'Good afternoon 👋' },
  greetEvening:   { ca: 'Bona nit 🌙',   es: 'Buenas noches 🌙',  en: 'Good night 🌙' },

  // Nav
  dashboard:  { ca: 'Dashboard',  es: 'Dashboard',   en: 'Dashboard' },
  clients:    { ca: 'Clients',    es: 'Clientes',    en: 'Clients' },
  campaigns:  { ca: 'Campanyes',  es: 'Campañas',    en: 'Campaigns' },
  tasks:      { ca: 'Tasques',    es: 'Tareas',      en: 'Tasks' },
  sessions:   { ca: 'Sessions',   es: 'Sesiones',    en: 'Sessions' },
  calendar:   { ca: 'Calendari',  es: 'Calendario',  en: 'Calendar' },
  metrics:    { ca: 'Mètriques',  es: 'Métricas',    en: 'Metrics' },
  admin:      { ca: 'Admin',      es: 'Admin',        en: 'Admin' },

  // Finance nav
  finResum:      { ca: 'Resum general',      es: 'Resumen general',     en: 'General overview' },
  finCartera:    { ca: 'Cartera de clients', es: 'Cartera de clientes', en: 'Client portfolio' },
  finProveidors: { ca: 'Proveïdors',         es: 'Proveedores',         en: 'Suppliers' },
  finEstructura: { ca: 'Gastos d\'estructura', es: 'Gastos de estructura', en: 'Structure costs' },
  finGrafics:    { ca: 'Gràfics',            es: 'Gráficos',            en: 'Charts' },

  // Sidebar
  sectionMenu:     { ca: 'Menu',    es: 'Menú',     en: 'Menu' },
  sectionServices: { ca: 'Serveis', es: 'Servicios', en: 'Services' },
  collapseMenu:    { ca: 'Col·lapsar menú', es: 'Colapsar menú', en: 'Collapse menu' },
  expandMenu:      { ca: 'Expandir menú',   es: 'Expandir menú', en: 'Expand menu' },

  // Quick task
  quickTask:        { ca: 'Crear tasca ràpida',      es: 'Crear tarea rápida',    en: 'Create quick task' },
  quickTaskPlaceholder: { ca: 'Títol de la tasca...', es: 'Título de la tarea...', en: 'Task title...' },
  quickTaskCreating:    { ca: 'Creant...',            es: 'Creando...',             en: 'Creating...' },
  quickTaskDone:        { ca: '✓ Creada!',            es: '✓ ¡Creada!',             en: '✓ Created!' },

  // Common actions
  save:    { ca: 'Desar',       es: 'Guardar',   en: 'Save' },
  saveAll: { ca: 'Desar canvis', es: 'Guardar cambios', en: 'Save changes' },
  cancel:  { ca: 'Cancel·lar',  es: 'Cancelar',  en: 'Cancel' },
  close:   { ca: 'Tancar',      es: 'Cerrar',    en: 'Close' },
  create:  { ca: 'Crear',       es: 'Crear',     en: 'Create' },
  edit:    { ca: 'Editar',      es: 'Editar',    en: 'Edit' },
  delete:  { ca: 'Eliminar',    es: 'Eliminar',  en: 'Delete' },
  search:  { ca: 'Cerca...',    es: 'Buscar...', en: 'Search...' },

  // Tasks page
  newTask:       { ca: 'Nova tasca',    es: 'Nueva tarea',  en: 'New task' },
  searchTask:    { ca: 'Buscar tasca...', es: 'Buscar tarea...', en: 'Search task...' },
  noTasks:       { ca: 'Cap tasca.',    es: 'Sin tareas.',  en: 'No tasks.' },
  filters:       { ca: 'Filtres',       es: 'Filtros',      en: 'Filters' },
  clearFilters:  { ca: 'Netejar',       es: 'Limpiar',      en: 'Clear' },
  sortBy:        { ca: 'Ordenar per',   es: 'Ordenar por',  en: 'Sort by' },
  inbox:         { ca: 'Inbox',         es: 'Bandeja',      en: 'Inbox' },
  todo:          { ca: 'Per fer',       es: 'Por hacer',    en: 'To do' },
  inProgress:    { ca: 'En curs',       es: 'En curso',     en: 'In progress' },
  review:        { ca: 'Revisió',       es: 'Revisión',     en: 'Review' },
  blocked:       { ca: 'Bloquejat',     es: 'Bloqueado',    en: 'Blocked' },
  done:          { ca: 'Fet',           es: 'Hecho',        en: 'Done' },

  // Priority
  low:    { ca: 'Baixa',   es: 'Baja',    en: 'Low' },
  medium: { ca: 'Mitja',   es: 'Media',   en: 'Medium' },
  high:   { ca: 'Alta',    es: 'Alta',    en: 'High' },
  urgent: { ca: 'Urgent',  es: 'Urgente', en: 'Urgent' },

  // List view columns
  colTask:        { ca: 'Tasca',       es: 'Tarea',        en: 'Task' },
  colStatus:      { ca: 'Estat',       es: 'Estado',       en: 'Status' },
  colLabels:      { ca: 'Etiquetes',   es: 'Etiquetas',    en: 'Labels' },
  colCheck:       { ca: 'Check',       es: 'Check',        en: 'Check' },
  colResponsible: { ca: 'Responsable', es: 'Responsable',  en: 'Responsible' },
  colDeadline:    { ca: 'Data límit',  es: 'Fecha límite', en: 'Deadline' },

  // Clients page
  newClient:    { ca: 'Nou client',   es: 'Nuevo cliente', en: 'New client' },
  noClients:    { ca: 'Cap client.',  es: 'Sin clientes.', en: 'No clients.' },
  searchClient: { ca: 'Buscar client...', es: 'Buscar cliente...', en: 'Search client...' },

  // Profile
  myProfile:  { ca: 'El meu perfil', es: 'Mi perfil',   en: 'My profile' },
  language:   { ca: 'Idioma',        es: 'Idioma',       en: 'Language' },
  services:   { ca: 'Serveis personals', es: 'Servicios personales', en: 'Personal services' },
  saveUrls:   { ca: 'Desar URLs',    es: 'Guardar URLs', en: 'Save URLs' },
  saved:      { ca: 'Desat',         es: 'Guardado',     en: 'Saved' },

  // Logout
  logout:         { ca: 'Tancar sessió', es: 'Cerrar sesión', en: 'Log out' },
  confirmLogout:  { ca: 'Segur?',        es: '¿Seguro?',      en: 'Sure?' },

  // Misc
  noDeadline:  { ca: 'Sense data',    es: 'Sin fecha',    en: 'No date' },
  unassigned:  { ca: 'Sense asig.',   es: 'Sin asignar',  en: 'Unassigned' },
  loading:     { ca: 'Carregant...',  es: 'Cargando...',  en: 'Loading...' },
  saving:      { ca: 'Desant...',     es: 'Guardando...', en: 'Saving...' },
  globalSearch:{ ca: 'Cerca global (⌘K)', es: 'Búsqueda global (⌘K)', en: 'Global search (⌘K)' },
  notifications:{ ca: 'Notificacions', es: 'Notificaciones', en: 'Notifications' },
}

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'ca'
  const stored = localStorage.getItem('guinew-language') as Lang | null
  return stored && ['ca', 'es', 'en'].includes(stored) ? stored : 'ca'
}

export function t(key: keyof typeof TRANSLATIONS, lang: Lang): string {
  return TRANSLATIONS[key]?.[lang] ?? TRANSLATIONS[key]?.['ca'] ?? key
}
