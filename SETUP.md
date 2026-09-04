# GUINEW OS — Guia de Setup

## Requisits previs
- Node.js 20+
- Compte Supabase (https://supabase.com)

## 1. Configuració de Supabase

### Crear projecte
1. Ves a https://supabase.com i crea un nou projecte
2. Anota les credencials:
   - Project URL
   - Anon Key
   - Service Role Key (a Settings → API)

### Importar esquema de base de dades
1. Ves a SQL Editor al dashboard de Supabase
2. Executa el contingut de `supabase/schema.sql`

### Crear el primer usuari (Superadmin)
1. A Supabase → Authentication → Users → Invite User
2. Introdueix el correu del superadmin
3. Un cop creat, executa al SQL Editor:
   ```sql
   UPDATE profiles
   SET role = 'superadmin', full_name = 'Nom Complet', position = 'CEO'
   WHERE email = 'email@agenciaguinew.com';
   ```

## 2. Variables d'entorn

Copia `.env.local` i omple les variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Per producció:
```
NEXT_PUBLIC_APP_URL=https://tools.agenciaguinew.com
```

## 3. Instal·lació i execució

```bash
npm install
npm run dev
```

L'aplicació estarà disponible a http://localhost:3000

## 4. Build per producció

```bash
npm run build
npm start
```

## 5. Deploy (Vercel recomanat)

1. Connecta el repositori a Vercel
2. Afegeix les variables d'entorn
3. Desplegament automàtic

## 6. Estructura de la plataforma

```
/login          → Pantalla d'accés
/dashboard      → Centre de comandament
/clients        → Gestió de clients
/clients/[id]   → Fitxa de client (360º)
/projects       → Gestió de projectes
/tasks          → Gestió de tasques (Kanban + Llista)
/calendar       → Calendari de reunions i deadlines
/documents      → Integració Google Drive
/metrics        → Mètriques i reporting
/processes      → Processos interns
/admin          → Gestió d'equip (Superadmin)
```

## 7. Rols

| Rol | Permisos |
|-----|----------|
| `superadmin` | Accés total. Gestió d'usuaris, clients, projectes, config |
| `manager` | Gestió de clients, projectes i tasques |
| `team_member` | Accés a clients i projectes assignats |

## 8. Integrations pendents (pròxima versió)

- Google OAuth (Drive + Calendar)
- Instagram Insights
- TikTok Analytics
- YouTube Analytics
- LinkedIn Analytics

## 9. Variables d'entorn per integracions futures

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
