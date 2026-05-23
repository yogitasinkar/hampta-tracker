import { useState } from 'react'
import { supabase } from '../lib/supabase'

const WEEK_TAGS = ['Base', 'Base', 'Build', 'Peak', 'Taper']

export default function PlanView({
  isMine, userId, name, baseline, plan, dayLogs, checkins, readiness, onChange,
}) {
  const [busyWeek, setBusyWeek] = useState(null)
  const [recalErr, setRecalErr] = useState('')
  const [checkinWeek, setCheckinWeek] = useState(null)

  const weeks = plan?.plan_json || []

  const logFor = (w, d) => dayLogs.find((l) => l.week_num === w && l.day_num === d)
  const checkinFor = (w) => checkins.find((c) => c.week_num === w)

  async function toggleDay(w, d) {
    if (!isMine) return
    const existing = logFor(w, d)
    await supabase.from('day_logs').upsert({
      user_id: userId,
      week_num: w,
      day_num: d,
      completed: !existing?.completed,
    }, { onConflict: 'user_id,week_num,day_num' })
    onChange()
  }

  // --- Adaptive recalibration via the Supabase Edge Function ---------------
  async function recalibrate(weekIndex) {
    if (!isMine) return
    setBusyWeek(weekIndex)
    setRecalErr('')
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recalibrate`
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          displayName: name,
          baseline,
          checkins,
          weeksRemaining: weeks.length - weekIndex,
          currentWeekPlan: weeks[weekIndex],
        }),
      })
      const result = await resp.json()
      if (!resp.ok || result.error) {
        setRecalErr(result.error || 'Recalibration failed. The plan is unchanged.')
        setBusyWeek(null)
        return
      }
      if (Array.isArray(result.week) && result.week.length === 7) {
        const next = weeks.map((w, i) => (i === weekIndex ? result.week : w))
        await supabase.from('plans').upsert({
          user_id: userId,
          plan_json: next,
          version: (plan.version || 1) + 1,
        }, { onConflict: 'user_id' })
        onChange()
      } else {
        setRecalErr('Got an unexpected response shape. The plan is unchanged.')
      }
    } catch (e) {
      setRecalErr('Could not reach the recalibration service. The plan is unchanged.')
    }
    setBusyWeek(null)
  }

  return (
    <div>
      {/* Readiness summary */}
      <div className={'readiness ' + readiness.level}>
        <div className="lvl">
          {name}’s readiness:{' '}
          {readiness.level === 'on-track' ? 'On track'
            : readiness.level === 'building' ? 'Building'
            : readiness.level === 'behind' ? 'Behind — close the gap'
            : readiness.level === 'caution' ? 'Caution'
            : 'Not yet assessed'}
        </div>
        <p style={{ marginTop: 4 }}>{readiness.message}</p>
        {readiness.totalDays > 0 && (
          <>
            <div className="bar">
              <div style={{ width: `${readiness.adherence}%` }} />
            </div>
            <p className="muted-note">
              {readiness.doneDays} of {readiness.totalDays} training days done ·{' '}
              {readiness.adherence}% adherence
            </p>
          </>
        )}
      </div>

      {/* Baseline summary card */}
      <div className="card">
        <h3>Baseline assessment</h3>
        <p className="muted-note" style={{ marginTop: 6 }}>
          Endurance band: <strong>{baseline.band_endurance}</strong> · Strength band:{' '}
          <strong>{baseline.band_strength}</strong>
        </p>
        <p className="muted-note" style={{ marginTop: 4 }}>
          Stairs {baseline.stair_seconds}s · 1.6 km walk {baseline.walk_minutes} min
          (exertion {baseline.walk_exertion}/10) · {baseline.squat_reps} squats ·{' '}
          {baseline.wallsit_seconds}s wall sit
        </p>
      </div>

      {/* Week by week */}
      {weeks.map((week, wi) => {
        const wNum = wi + 1
        const chk = checkinFor(wNum)
        return (
          <div key={wi}>
            <div className="week-head">
              <h3>Week {wNum}</h3>
              <span className="week-tag">{WEEK_TAGS[wi]}</span>
            </div>

            {week.map((day) => {
              const log = logFor(wNum, day.day)
              const done = !!log?.completed
              return (
                <div
                  key={day.day}
                  className={'day' + (done ? ' done' : '') + (day.rest ? ' rest' : '')}
                >
                  <div
                    className="check"
                    onClick={() => !day.rest && toggleDay(wNum, day.day)}
                    style={{ visibility: day.rest ? 'hidden' : 'visible' }}
                  >
                    {done ? '✓' : ''}
                  </div>
                  <div className="body">
                    <div className="focus">Day {day.day} · {day.focus}</div>
                    <div className="detail">{day.detail}</div>
                    <span className={'pill ' + day.pillar}>{day.pillar}</span>
                  </div>
                </div>
              )
            })}

            {/* Weekly check-in + recalibration */}
            {isMine && (
              <div className="card">
                {chk ? (
                  <p className="muted-note">
                    Week {wNum} check-in logged · effort {chk.effort_rating}/10 ·
                    soreness {chk.soreness}/10
                    {chk.pain_flag ? ' · ⚠ pain flagged' : ''}
                  </p>
                ) : (
                  <p className="muted-note">
                    No check-in for week {wNum} yet. Log one to enable an accurate
                    recalibration.
                  </p>
                )}
                <div className="row" style={{ marginTop: 10 }}>
                  <button
                    className="btn-ghost"
                    onClick={() => setCheckinWeek(checkinWeek === wNum ? null : wNum)}
                  >
                    {chk ? 'Update check-in' : 'Log week check-in'}
                  </button>
                  <button
                    className="btn-saffron"
                    disabled={busyWeek === wi}
                    onClick={() => recalibrate(wi)}
                  >
                    {busyWeek === wi ? 'Recalibrating…' : 'Recalibrate this week (AI)'}
                  </button>
                </div>
                {checkinWeek === wNum && (
                  <CheckinForm
                    userId={userId}
                    weekNum={wNum}
                    existing={chk}
                    onSaved={() => { setCheckinWeek(null); onChange() }}
                  />
                )}
                {recalErr && busyWeek === null && <div className="error">{recalErr}</div>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CheckinForm({ userId, weekNum, existing, onSaved }) {
  const [sessions, setSessions] = useState(existing?.sessions_done ?? '')
  const [effort, setEffort] = useState(existing?.effort_rating ?? '')
  const [soreness, setSoreness] = useState(existing?.soreness ?? '')
  const [pain, setPain] = useState(existing?.pain_flag ?? false)
  const [painNote, setPainNote] = useState(existing?.pain_note ?? '')
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    await supabase.from('checkins').upsert({
      user_id: userId,
      week_num: weekNum,
      sessions_done: Number(sessions) || 0,
      effort_rating: Number(effort) || 0,
      soreness: Number(soreness) || 0,
      pain_flag: pain,
      pain_note: pain ? painNote : null,
    }, { onConflict: 'user_id,week_num' })
    setBusy(false)
    onSaved()
  }

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
      <label>Training sessions completed this week</label>
      <input type="number" value={sessions} onChange={(e) => setSessions(e.target.value)} />
      <label>How hard did the week feel? (1 easy – 10 brutal)</label>
      <input type="number" value={effort} onChange={(e) => setEffort(e.target.value)} />
      <label>Average soreness (1 – 10)</label>
      <input type="number" value={soreness} onChange={(e) => setSoreness(e.target.value)} />
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
        <input
          type="checkbox"
          checked={pain}
          onChange={(e) => setPain(e.target.checked)}
          style={{ width: 'auto' }}
        />
        I had pain (not just soreness) somewhere
      </label>
      {pain && (
        <>
          <label>Where / what kind of pain?</label>
          <input value={painNote} onChange={(e) => setPainNote(e.target.value)} />
        </>
      )}
      <div className="spacer" />
      <button className="btn-primary" disabled={busy} onClick={save}>
        {busy ? 'Saving…' : 'Save check-in'}
      </button>
    </div>
  )
}
