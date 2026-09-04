'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError('No hem pogut enviar el correu. Torna-ho a provar.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #040d1f 0%, #0a1a3a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: '#ffffff60', fontSize: '13px', textDecoration: 'none',
          marginBottom: '32px', transition: 'color 0.15s',
        }}>
          ← Tornar al login
        </Link>

        <div style={{
          background: 'white', borderRadius: '16px', padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0a0a0a', letterSpacing: '-0.02em' }}>
              Recuperar contrasenya
            </h1>
            <p style={{ fontSize: '14px', color: '#5C5C5C', marginTop: '8px', lineHeight: '1.5' }}>
              Introdueix el teu email i t&apos;enviarem un link per restablir la contrasenya.
            </p>
          </div>

          {sent ? (
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px',
              padding: '16px', fontSize: '14px', color: '#16A34A',
            }}>
              ✓ Correu enviat! Revisa la teva safata d&apos;entrada.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#0a0a0a', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@agenciaguinew.com"
                  required
                  style={{
                    height: '48px', padding: '0 16px', border: '1.5px solid #E8E8E8',
                    borderRadius: '8px', fontSize: '15px', color: '#0a0a0a',
                    background: '#F8F8F8', outline: 'none',
                  }}
                />
              </div>

              {error && (
                <div style={{
                  fontSize: '13px', color: '#DC2626', background: '#FEF2F2',
                  border: '1px solid #FECACA', padding: '10px 14px', borderRadius: '8px',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  height: '48px', background: '#1B2B4B', color: 'white', border: 'none',
                  borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, marginTop: '4px',
                }}
              >
                {loading ? 'Enviant...' : 'Enviar link de recuperació'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
