import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Supabase Auth requires an email — we synthesise one from the username.
// The domain is never emailed to; it just needs to be consistent.
const FAKE_DOMAIN = '@hampta.tracker'
const toEmail = (u) => u.toLowerCase().trim() + FAKE_DOMAIN

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    const u = username.trim()
    if (!u || !password) return
    if (u.includes('@') || u.includes(' ')) {
      setErr('Username cannot contain @ or spaces')
      return
    }

    setBusy(true)
    setErr('')

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email: toEmail(u), password })
      if (error) setErr('Wrong username or password')
    } else {
      const { data, error } = await supabase.auth.signUp({ email: toEmail(u), password })
      if (error) {
        setErr(error.message)
      } else if (data.user) {
        // Create profile immediately — display name = username
        const { error: profileErr } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, display_name: u })
        if (profileErr && profileErr.code !== '23505') setErr(profileErr.message)
      }
    }

    setBusy(false)
  }

  return (
    <div className="wrap">
      <header className="masthead">
        <div className="kicker">Himalaya · 4,300 m</div>
        <h1>Hampta Pass Trainer</h1>
        <div className="dates">A 5-week Himalayan training plan</div>
      </header>

      <div className="card">
        <h2>{mode === 'signin' ? 'Sign in' : 'Create an account'}</h2>
        <label>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />
        {err && <div className="error">{err}</div>}
        <div className="spacer" />
        <button
          className="btn-primary"
          disabled={busy || !username.trim() || !password}
          onClick={submit}
        >
          {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
        <div className="spacer" />
        <p className="muted-note center">
          {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
          <button
            className="btn-ghost"
            style={{ padding: '4px 10px', fontSize: 13 }}
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErr('') }}
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
