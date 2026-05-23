import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { scoreBaseline, generatePlan, evaluateReadiness } from './lib/training'
import Auth from './components/Auth'
import Assessment from './components/Assessment'
import PlanView from './components/PlanView'

const TREK_LABEL = 'June 29 – July 3'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const [profiles, setProfiles] = useState([])
  const [activeUser, setActiveUser] = useState(null) // which person's track is shown
  const [data, setData] = useState({}) // keyed by user_id: {baseline, plan, dayLogs, checkins}

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const loadAll = useCallback(async () => {
    const [{ data: profs }, { data: bases }, { data: plans }, { data: logs }, { data: chk }] =
      await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('baselines').select('*'),
        supabase.from('plans').select('*'),
        supabase.from('day_logs').select('*'),
        supabase.from('checkins').select('*'),
      ])

    setProfiles(profs || [])
    const byUser = {}
    for (const p of profs || []) {
      byUser[p.id] = {
        baseline: (bases || []).find((b) => b.user_id === p.id) || null,
        plan: (plans || []).find((pl) => pl.user_id === p.id) || null,
        dayLogs: (logs || []).filter((l) => l.user_id === p.id),
        checkins: (chk || []).filter((c) => c.user_id === p.id).sort((a, b) => a.week_num - b.week_num),
      }
    }
    setData(byUser)
    if (!activeUser && session) setActiveUser(session.user.id)
  }, [activeUser, session])

  useEffect(() => {
    if (session) loadAll()
  }, [session, loadAll])

  if (loading) return <div className="wrap center" style={{ paddingTop: 80 }}>Loading…</div>
  if (!session) return <Auth />

  const me = session.user.id
  const myProfile = profiles.find((p) => p.id === me)

  // If signed in but no profile row yet, force profile creation.
  if (!myProfile) return <Auth needsProfile session={session} onDone={loadAll} />

  const viewing = activeUser || me
  const viewData = data[viewing] || { baseline: null, plan: null, dayLogs: [], checkins: [] }
  const isMine = viewing === me

  return (
    <div className="wrap">
      <header className="masthead">
        <div className="kicker">Himalaya · 4,300 m</div>
        <h1>Hampta Pass Trainer</h1>
        <div className="dates">Trek dates · {TREK_LABEL}</div>
      </header>

      {profiles.length > 0 && (
        <div className="tabs">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={'tab' + (p.id === viewing ? ' active' : '')}
              onClick={() => setActiveUser(p.id)}
            >
              {p.display_name}
              {p.id === me ? ' (you)' : ''}
            </div>
          ))}
        </div>
      )}

      {!viewData.baseline ? (
        isMine ? (
          <Assessment
            onSubmit={async (vals) => {
              const scored = scoreBaseline(vals)
              await supabase.from('baselines').upsert({
                user_id: me,
                ...vals,
                band_endurance: scored.band_endurance,
                band_strength: scored.band_strength,
              })
              const plan = generatePlan(scored.tier)
              await supabase.from('plans').upsert({ user_id: me, plan_json: plan, version: 1 })
              loadAll()
            }}
          />
        ) : (
          <div className="card center">
            <p className="muted-note">
              {profiles.find((p) => p.id === viewing)?.display_name} hasn’t completed
              their baseline assessment yet.
            </p>
          </div>
        )
      ) : (
        <PlanView
          isMine={isMine}
          userId={viewing}
          name={profiles.find((p) => p.id === viewing)?.display_name}
          baseline={viewData.baseline}
          plan={viewData.plan}
          dayLogs={viewData.dayLogs}
          checkins={viewData.checkins}
          readiness={evaluateReadiness({
            baseline: viewData.baseline,
            checkins: viewData.checkins,
            plan: viewData.plan?.plan_json,
            dayLogs: viewData.dayLogs,
          })}
          onChange={loadAll}
        />
      )}

      <div className="card">
        <p className="muted-note">
          Signed in as <strong>{myProfile.display_name}</strong>.{' '}
          <button
            className="btn-ghost"
            style={{ padding: '4px 10px', fontSize: 13 }}
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
        </p>
        <p className="muted-note" style={{ marginTop: 10 }}>
          This plan trains fitness, not altitude. Acclimatisation is handled on-trek by
          pacing and hydration. Break in your trek shoes now and wear them for every
          loaded walk.
        </p>
      </div>
    </div>
  )
}
