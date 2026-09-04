'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Credencials incorrectes. Torna-ho a provar.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="page">
      <div className="card">
        {/* Left panel */}
        <div className="left">
          <div className="line l1" /><div className="line l2" /><div className="line l3" />
          <div className="left-content">
            <h1 className="hero">
              Totes les teves<br />
              <em className="accent">eines</em>,<br />
              un sol <em className="accent">accés</em>.
            </h1>
            <p className="hero-sub">Plataforma interna · Agència Guinew</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="right">
          <div className="right-inner">
            <div className="logo-row">
              <img src="/logo-guinew.png" alt="Guinew" className="logo-img" />
            </div>
            <div className="heading">
              <h2>Agència Guinew · Tools</h2>
              <p>Accés intern de l&apos;agència.</p>
            </div>
            <form onSubmit={handleLogin} className="form">
              <div className="field">
                <label htmlFor="email">EMAIL</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@agenciaguinew.com" required autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="password">CONTRASENYA</label>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
              </div>
              {error && <div className="err">{error}</div>}
              <button type="submit" className="submit" disabled={loading}>
                {loading ? 'Accedint...' : 'Iniciar sessió'}
              </button>
              <Link href="/forgot-password" className="forgot">¿Heu oblidat la contrasenya?</Link>
            </form>
            <div className="footer">agenciaguinew.com</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh; background: #000;
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .card {
          display: flex; width: 100%; max-width: 720px; min-height: 430px;
          border-radius: 18px; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.7);
        }
        /* LEFT */
        .left {
          flex: 1; position: relative;
          background: linear-gradient(155deg, #091527 0%, #0d2050 45%, #142870 100%);
          display: none; overflow: hidden; flex-direction: column;
        }
        @media (min-width: 600px) { .left { display: flex; } }
        .line {
          position: absolute; top: 0; bottom: 0; width: 1px;
          background: linear-gradient(to bottom, transparent 5%, #4A8FE035 45%, #4A8FE015 70%, transparent 95%);
        }
        .l1 { left: 33%; }
        .l2 { left: 55%; opacity: 0.6; }
        .l3 { left: 77%; opacity: 0.3; }
        .left-content {
          position: relative; z-index: 1; display: flex; flex-direction: column;
          justify-content: flex-end; padding: 40px 44px; height: 100%;
        }
        .hero {
          font-size: clamp(24px, 3vw, 36px); font-weight: 300; line-height: 1.2;
          color: #dce8f8; letter-spacing: -0.01em;
          font-family: 'Bai Jamjuree', sans-serif; margin-bottom: 16px;
        }
        .accent { font-style: italic; font-weight: 400; color: #7ab4e8; }
        .hero-sub { font-size: 12px; color: rgba(255,255,255,0.3); letter-spacing: 0.03em; }
        /* RIGHT */
        .right {
          width: 100%; background: #F5F6F8;
          display: flex; align-items: center; justify-content: center; padding: 40px 32px;
        }
        @media (min-width: 600px) { .right { width: 320px; flex-shrink: 0; max-width: 320px; } }
        .right-inner { width: 100%; display: flex; flex-direction: column; gap: 18px; }
        .logo-row { display: flex; align-items: center; }
        .logo-img { height: 30px; width: auto; object-fit: contain; }
        .heading h2 {
          font-size: 16px; font-weight: 700; color: #1A2744;
          letter-spacing: -0.01em; font-family: 'Bai Jamjuree', sans-serif;
        }
        .heading p { font-size: 13px; color: #6B7280; margin-top: 3px; }
        .form { display: flex; flex-direction: column; gap: 12px; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .field label { font-size: 10px; font-weight: 700; color: #6B7280; letter-spacing: 0.1em; }
        .field input {
          height: 42px; padding: 0 12px; border: 1.5px solid #DDE1E8; border-radius: 8px;
          font-size: 14px; color: #1A2744; background: white; outline: none;
          font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field input:focus { border-color: #4A7FC1; box-shadow: 0 0 0 3px rgba(74,127,193,0.15); }
        .field input::placeholder { color: #B0B8C8; }
        .err { font-size: 12.5px; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; padding: 9px 12px; border-radius: 7px; }
        .submit {
          height: 42px; background: #4A7FC1; color: white; border: none; border-radius: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: inherit; margin-top: 2px;
        }
        .submit:hover:not(:disabled) { background: #3A6BB0; }
        .submit:disabled { opacity: 0.7; cursor: not-allowed; }
        .forgot { text-align: center; font-size: 12px; color: #4A7FC1; text-decoration: none; transition: color 0.15s; }
        .forgot:hover { color: #3A6BB0; text-decoration: underline; }
        .footer { text-align: center; font-size: 11.5px; color: #B0B8C8; padding-top: 10px; border-top: 1px solid #E5E8EE; }
      `}</style>
    </div>
  )
}
