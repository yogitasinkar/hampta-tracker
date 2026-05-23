import { useState } from 'react'

// The four baseline tests. Each is a cheap, equipment-free proxy for
// something Hampta Pass specifically demands.
const TESTS = [
  {
    key: 'stair_seconds',
    label: 'Stair climb — continuous, in seconds',
    why: 'Best predictor of summit day — measures your sustained uphill capacity.',
    placeholder: 'e.g. 90',
    hint: 'Find a staircase with multiple floors. Climb at a pace that is hard but continuous — not sprinting, not strolling. Start the timer when you begin, stop it the moment you must rest. Enter total seconds.',
  },
  {
    key: 'walk_minutes',
    label: 'Brisk 1.6 km walk — time in minutes',
    why: 'Measures your aerobic base.',
    placeholder: 'e.g. 16',
    hint: 'Walk 1.6 km (roughly 1 mile, or 4 laps of a standard track) as fast as you comfortably can — brisk pace, not jogging. Record total minutes. Decimals fine, e.g. 15.5.',
  },
  {
    key: 'walk_exertion',
    label: 'How winded after the walk — 1 to 10',
    why: 'Calibrates your walk time to actual effort so the plan is not thrown off by a flat vs. hilly route.',
    placeholder: '1 = easy, 10 = gasping',
    hint: 'Rate yourself immediately after finishing. 1 = could hold a full conversation, 10 = gasping and cannot speak. Be honest — this adjusts your result.',
  },
  {
    key: 'squat_reps',
    label: 'Bodyweight squats to form failure — reps',
    why: 'Measures quad endurance for descents — the Shea Goru descent destroys undertrained legs.',
    placeholder: 'e.g. 20',
    hint: 'Feet shoulder-width, full depth (thighs parallel to floor), back straight. Count until your form breaks — knees caving in, back rounding — not just when it burns.',
  },
  {
    key: 'wallsit_seconds',
    label: 'Wall sit — hold time in seconds',
    why: 'Measures static leg strength and knee resilience for long loaded descents.',
    placeholder: 'e.g. 45',
    hint: 'Slide down a flat wall until thighs are parallel to the floor (90° at the knee). Hold as long as you can. Stop when your thighs rise above parallel.',
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
        Five quick tests measure where you actually are — your results set the
        starting volume and intensity of your plan. Do them when fresh (not after
        a workout), warm up for 5 minutes first, and spread them across a day or
        two if needed. Stop any test if you feel pain.
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
