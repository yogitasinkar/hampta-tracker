import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth({ needsProfile, session, onDone }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // Stage 2: signed in but no profile row — capture display name.
  if (needsProfile) {
    return (
      <div className="wrap">
        <header className="masthead">
          <div className="kicker">One last step</div>
          <h1>Who’s training?</h1>
        </header>
        <div className="card">
          <label>Your display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Yogi"
          />
          {err && <div className="error">{err}</div>}
          <div className="spacer" />
          <button
            className="btn-primary"
            disabled={busy || !name.trim()}
            onClick={async () => {
              setBusy(true)
              setErr('')
              const { error } = await supabase
                .from('profiles')
                .insert({ id: session.user.id, display_name: name.trim() })
              setBusy(false)
              if (error) setErr(error.message)
              else onDone()
            }}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  async function submit() {
    setBusy(true)
    setErr('')
    const fn = mode === 'signin' ? 'signInWithPassword' : 'signUp'
    const { error } = await supabase.auth[fn]({ email, password })
    setBusy(false)
    if (error) setErr(error.message)
  }

  return (
    <div className="wrap">
      <header className="masthead">
        <div className="kicker">Himalaya · 4,300 m</div>
        <h1>Hampta Pass Trainer</h1>
        <div className="dates">A 5-week plan for two trekkers</div>
      </header>

      <div className="card">
        <h2>{mode === 'signin' ? 'Sign in' : 'Create an account'}</h2>
        <p className="sub">
          Both of you sign in to this same app — you’ll each see both training tracks.
        </p>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />
        {err && <div className="error">{err}</div>}
        <div className="spacer" />
        <button className="btn-primary" disabled={busy} onClick={submit}>
          {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
        <div className="spacer" />
        <p className="muted-note center">
          {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
          <button
            className="btn-ghost"
            style={{ padding: '4px 10px', fontSize: 13 }}
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
