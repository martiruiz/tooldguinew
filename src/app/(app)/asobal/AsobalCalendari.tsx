'use client'

// Colors ASOBAL brand
const C = {
  navy:       '#0006FF',   // ASOBAL blue
  navyLight:  '#162D6A',   // nav lighter variant
  headerText: '#FFFFFF',   // white on navy
  barHome:    '#CC0000',   // ASOBAL red → Barça home
  bmgHome:    '#1A3E6E',   // navy-blue → Granollers home
  clasico:    '#B45309',   // amber gold → clàssic
  rowText:    '#111827',
  fueraText:  '#9CA3AF',
}

interface Row {
  jornada: string
  fecha: string
  bar: string
  bmg: string
  visitants: string
}

const PRIMERA: Row[] = [
  { jornada: 'J1',  fecha: '12/09', bar: 'LOG-BAR', bmg: 'BMG-CNG', visitants: 'CANGAS' },
  { jornada: 'J2',  fecha: '19/09', bar: 'FUERA',   bmg: 'FUERA',   visitants: '-' },
  { jornada: 'J3',  fecha: '26/9',  bar: 'FUERA',   bmg: 'FUERA',   visitants: '-' },
  { jornada: 'J4',  fecha: '4/10',  bar: 'BAR-EON', bmg: 'BMG-CQN', visitants: 'BARÇA & EON ALICANTE' },
  { jornada: 'J5',  fecha: '11/10', bar: 'FUERA',   bmg: 'FUERA',   visitants: '-' },
  { jornada: 'J6',  fecha: '18/10', bar: 'FUERA',   bmg: 'FUERA',   visitants: '-' },
  { jornada: 'J7',  fecha: '25/10', bar: 'FCB-CQN', bmg: 'BMG-PGE', visitants: 'CUENCA' },
  { jornada: 'J8',  fecha: '1/11',  bar: '',        bmg: 'BMG-FCB', visitants: 'GRANOLLERS' },
  { jornada: 'J3',  fecha: '11/11', bar: 'FCB-CAS', bmg: 'FUERA',   visitants: 'CASERIO' },
  { jornada: 'J9',  fecha: '14/11', bar: 'FCB-SEV', bmg: 'LOG-BMG', visitants: 'SEVILLA' },
  { jornada: 'J10', fecha: '21/11', bar: 'BID-FCB', bmg: 'BMG-ATV', visitants: 'VALLADOLID' },
  { jornada: 'J11', fecha: '28/11', bar: 'FCB-NAV', bmg: 'FUERA',   visitants: 'NAVA' },
  { jornada: 'J12', fecha: '05/12', bar: 'FCB-ATV', bmg: 'BMG-NAV', visitants: 'VALLADOLID/NAVA' },
  { jornada: 'J13', fecha: '12/12', bar: 'FUERA',   bmg: 'FUERA',   visitants: '-' },
  { jornada: 'J14', fecha: '19/12', bar: 'FCB-ADE', bmg: 'BMG-TLV', visitants: 'TORRELAVEGA' },
  { jornada: 'J15', fecha: '23/12', bar: 'FUERA',   bmg: 'FUERA',   visitants: '-' },
]

const SEGUNDA: Row[] = [
  { jornada: 'J16', fecha: '13/02', bar: 'FCB-LOG', bmg: 'CNG-BMG', visitants: 'LOGROÑO' },
  { jornada: 'J17', fecha: '20/02', bar: 'FCB-PGE', bmg: 'BMG-PSG', visitants: 'P.GENIL' },
  { jornada: 'J18', fecha: '27/02', bar: 'CAS-FCB', bmg: 'BMG-EON', visitants: 'ALICANTE' },
  { jornada: 'J19', fecha: '06/03', bar: 'FUERA',   bmg: 'FUERA',   visitants: '-' },
  { jornada: 'J20', fecha: '20/03', bar: 'FCB-VDA', bmg: 'BMG-CAS', visitants: 'ARANDA' },
  { jornada: 'J21', fecha: '27/03', bar: 'FCB-CNG', bmg: 'BMG-SEV', visitants: 'CANGAS/SEVILLA' },
  { jornada: 'J22', fecha: '03/04', bar: 'FUERA',   bmg: 'FUERA',   visitants: '-' },
  { jornada: 'J23', fecha: '10/04', bar: 'FCB-BMG', bmg: '',        visitants: 'BARÇA' },
  { jornada: 'J24', fecha: '17/04', bar: 'FUERA',   bmg: 'BMG-LOG', visitants: 'LOGROÑO' },
  { jornada: 'J25', fecha: '24/04', bar: 'FCB-BID', bmg: 'FUERA',   visitants: 'BIDASOA' },
  { jornada: 'J26', fecha: '01/05', bar: 'FUERA',   bmg: 'BMG-ADE', visitants: 'ADEMAR' },
  { jornada: 'J27', fecha: '22/05', bar: 'FUERA',   bmg: 'FUERA',   visitants: '-' },
  { jornada: 'J28', fecha: '29/05', bar: 'FCB-PSG', bmg: 'BMG-BID', visitants: 'P.SAGUNTO' },
  { jornada: 'J29', fecha: '02/06', bar: 'FUERA',   bmg: 'FUERA',   visitants: '-' },
  { jornada: 'J30', fecha: '05/06', bar: 'FCB-TLV', bmg: 'BMG-VDA', visitants: 'TORRELAVEGA/ARANDA' },
]

function isFuera(v: string) {
  return !v || v === 'FUERA' || v === '-' || v.trim() === ''
}

function isBarHome(v: string) {
  return v.startsWith('FCB') || v.startsWith('BAR')
}

function isBmgHome(v: string) {
  return v.startsWith('BMG')
}

function isClasico(row: Row) {
  return row.bar === 'FCB-BMG' || row.bmg === 'BMG-FCB'
}

function cellStyle(val: string, type: 'bar' | 'bmg', rowIsClasico: boolean): React.CSSProperties {
  if (isFuera(val)) return { background: 'transparent', color: C.fueraText }
  if (rowIsClasico) return { background: C.clasico, color: '#fff', fontWeight: 800 }
  if (type === 'bar' && isBarHome(val)) return { background: C.barHome, color: '#fff', fontWeight: 800 }
  if (type === 'bmg' && isBmgHome(val)) return { background: C.bmgHome, color: '#fff', fontWeight: 800 }
  return { background: 'rgba(0,0,0,0.06)', color: '#374151', fontWeight: 600 }
}

function rowBg(row: Row, idx: number) {
  if (isClasico(row)) return 'rgba(180,83,9,0.06)'
  return idx % 2 === 0 ? '#fff' : '#F4F6FB'
}

const COL = '56px 72px 1fr 1fr 1fr'

function TableHeader({ visitantsLabel }: { visitantsLabel: string }) {
  const th: React.CSSProperties = { fontSize: 10, fontWeight: 800, color: C.headerText, textTransform: 'uppercase', letterSpacing: '.08em', padding: '7px 8px' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: COL, background: C.navy }}>
      <div style={th}>Jornada</div>
      <div style={th}>Fecha</div>
      <div style={th}>BAR</div>
      <div style={th}>BMG</div>
      <div style={{ ...th, lineHeight: 1.3 }}>{visitantsLabel}</div>
    </div>
  )
}

function TableRow({ row, idx }: { row: Row; idx: number }) {
  const clasico = isClasico(row)
  const barStyle = cellStyle(row.bar, 'bar', clasico)
  const bmgStyle = cellStyle(row.bmg, 'bmg', clasico)
  const td: React.CSSProperties = { fontSize: 12, padding: '6px 8px', display: 'flex', alignItems: 'center' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: COL, background: rowBg(row, idx), borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      {/* Jornada */}
      <div style={{ ...td, fontWeight: 800, color: clasico ? C.clasico : C.navy, fontSize: 11, fontFamily: 'monospace' }}>{row.jornada}</div>
      {/* Fecha */}
      <div style={{ ...td, color: '#374151', fontWeight: 600, fontSize: 11 }}>{row.fecha}</div>
      {/* BAR */}
      <div style={{ ...td, padding: '4px 6px' }}>
        {!isFuera(row.bar) ? (
          <span style={{ ...barStyle, padding: '3px 8px', borderRadius: 5, fontSize: 11, display: 'inline-block' }}>{row.bar}</span>
        ) : (
          <span style={{ fontSize: 11, color: '#bbb' }}>FUERA</span>
        )}
      </div>
      {/* BMG */}
      <div style={{ ...td, padding: '4px 6px' }}>
        {!isFuera(row.bmg) ? (
          <span style={{ ...bmgStyle, padding: '3px 8px', borderRadius: 5, fontSize: 11, display: 'inline-block' }}>{row.bmg}</span>
        ) : (
          <span style={{ fontSize: 11, color: '#bbb' }}>FUERA</span>
        )}
      </div>
      {/* Visitants */}
      <div style={{ ...td, fontSize: 11, color: row.visitants === '-' ? '#ddd' : '#111', fontWeight: row.visitants !== '-' ? 700 : 400, fontStyle: 'normal' }}>
        {row.visitants === '-' ? '—' : row.visitants}
      </div>
    </div>
  )
}

export function AsobalCalendari() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px', background: '#F8F9FB' }}>

      {/* Llegenda */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { bg: C.barHome,  color: C.barHome,  label: 'Sessió Barça (casa)' },
          { bg: C.bmgHome,  color: C.bmgHome,  label: 'Sessió Granollers (casa)' },
          { bg: C.clasico,  color: C.clasico,  label: 'Clàssic FCB-BMG' },
        ].map(({ bg, color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: bg }} />
            <span style={{ color, fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Taula */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
      <div style={{ border: '2px solid ' + C.navy, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 12px rgba(10,15,107,0.12)', minWidth: 400 }}>

        {/* Main title */}
        <div style={{ background: C.navy, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.headerText, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Planificación Calendario de Sesiones
          </div>
        </div>

        {/* Primera Vuelta */}
        <TableHeader visitantsLabel={'Visitantes\nPrimera Vuelta'} />
        {PRIMERA.map((row, i) => <TableRow key={`p-${i}`} row={row} idx={i} />)}

        {/* Separador Segona Volta */}
        <div style={{ background: C.navy, padding: '7px 12px', textAlign: 'right' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: C.headerText, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.85 }}>Visitantes Segunda Vuelta →</span>
        </div>

        {/* Segona Volta */}
        {SEGUNDA.map((row, i) => <TableRow key={`s-${i}`} row={row} idx={i} />)}
      </div>
      </div>
    </div>
  )
}
