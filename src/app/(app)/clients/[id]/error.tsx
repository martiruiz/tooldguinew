'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ClientDetailError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error('[ClientDetail] Page error:', error)
  }, [error])

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px', gap: '16px', color: '#5C5C5C'
    }}>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626' }}>Error carregant el client</div>
      <div style={{
        fontSize: '12px', background: '#FEF2F2', border: '1px solid #FECACA',
        padding: '10px 14px', borderRadius: '8px', maxWidth: '500px', wordBreak: 'break-all'
      }}>
        {error.message || 'Error desconegut'}{error.digest ? ` (${error.digest})` : ''}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={retry}
          style={{ fontSize: '13px', color: '#1B2B4B', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Tornar a intentar
        </button>
        <Link href="/clients" style={{ fontSize: '13px', color: '#5C5C5C', textDecoration: 'underline' }}>
          ← Tornar als clients
        </Link>
      </div>
    </div>
  )
}
