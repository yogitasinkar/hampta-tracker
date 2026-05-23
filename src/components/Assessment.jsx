import { useState } from 'react'

// The four baseline tests. Each is a cheap, equipment-free proxy for
// something Hampta Pass specifically demands.
const TESTS = [
  {
    key: 'stair_seconds',
    label: 'Stair climb — continuous, in seconds',
    why: 'Proxy for sustained uphill capacity, the single best predictor of summit day.',
    placeholder: 'e.g. 90',
    hint: 'Climb stairs at a steady hard-but-doable pace. Stop the clock when you must stop. Enter total seconds.',
  },
  {
    key: 'walk_minutes',
    label: 'Brisk 1.6 km walk — time in minutes',
    why: 'Proxy for aerobic base.',
    placeholder: 'e.g. 16',
    hint: 'Walk 1.6 km (about 1 mile) as briskly as you comfortably can. Record minutes (decimals fine, e.g. 15.5).',
  },
  {
    key: 'walk_exertion',
    label: 'How winded after the walk — 1 to 10',
    why: 'Calibrates the walk result to real effort.',
    placeholder: '1 = easy, 10 = gasping',
    hint: 'Be honest — 1 means you could chat easily, 10 means you were gasping.',
  },
  {
    key: 'squat_reps',
    label: 'Bodyweight squats to form failure — reps',
    why: 'Proxy for descent-day quad endurance — the Shea Goru descent destroys undertrained legs.',
    placeholder: 'e.g. 20',
    hint: 'Full, controlled squats. Stop when form breaks, not when it merely burns.',
  },
  {
    key: 'wallsit_seconds',
    label: 'Wall sit — hold time in seconds',
    why: 'Proxy for static leg strength and knee resilience.',
    placeholder: 'e.g. 45',
    hint: 'Back flat against a wall, thighs parallel to floor. Hold as long as you can.',
  },
]

export default function Assessment({ onSubmit }) {
  const [vals, setVals] = useState({})
  const [err, setErr] = useState('')

  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }))

  function submit() {
    for (const t of TESTS) {
      if (vals[t.key] === undefined || vals[t.key] === '') {
        setErr('Please fill in all five tests — the plan is calibrated from them.')
        return
      }
    }
    setErr('')
    onSubmit({
      stair_seconds: Number(vals.stair_seconds),
      walk_minutes: Number(vals.walk_minutes),
      walk_exertion: Number(vals.walk_exertion),
      squat_reps: Number(vals.squat_reps),
      wallsit_seconds: Number(vals.wallsit_seconds),
    })
  }

  return (
    <div className="card">
      <h2>Baseline fitness assessment</h2>
      <p className="sub">
        Before the plan can be personalised, we measure where you actually are.
        Do these over a day or two when fresh, warm up first, and don’t push into
        pain. Your results decide your starting volume and intensity.
      </p>

      {TESTS.map((t) => (
        <div className="assess-test" key={t.key}>
          <label>{t.label}</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder={t.placeholder}
            value={vals[t.key] ?? ''}
            onChange={(e) => set(t.key, e.target.value)}
          />
          <div className="why">Why: {t.why}</div>
          <div className="muted-note" style={{ marginTop: 4 }}>{t.hint}</div>
        </div>
      ))}

      {err && <div className="error">{err}</div>}
      <div className="spacer" />
      <button className="btn-primary" onClick={submit}>
        Score me &amp; build my plan
      </button>
    </div>
  )
}
