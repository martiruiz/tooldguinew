import Link from 'next/link'

export default function ClientNotFound() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px', gap: '16px', color: '#5C5C5C'
    }}>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1B2B4B' }}>Client no trobat</div>
      <div style={{ fontSize: '13px' }}>Aquest client no existeix o no tens accés.</div>
      <Link href="/clients" style={{ fontSize: '13px', color: '#1B2B4B', textDecoration: 'underline' }}>
        ← Tornar als clients
      </Link>
    </div>
  )
}
