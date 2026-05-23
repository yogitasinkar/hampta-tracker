// ===========================================================================
// training.js — the brain of the tracker.
// Scores baseline assessments and generates the two calibrated 5-week plans.
// Everything here is trek-specific to Hampta Pass:
//   - tops out ~14,100 ft (4,300 m) at the pass
//   - summit day = steep snow climb + ~2,000 ft knee-heavy descent to Shea Goru
//   - 4-5 trekking days, back-to-back, daypack carried daily
// So the four pillars are: endurance base, leg/descent strength, incline
// capacity, and load carrying.
// ===========================================================================

// --- Baseline scoring -------------------------------------------------------
// Each test maps to a band. Thresholds are deliberately conservative: this
// trek punishes overestimation more than caution.

export function scoreBaseline(b) {
  // Endurance band from stair climb + timed walk.
  const stair = b.stair_seconds ?? 0;
  const walkPace = b.walk_minutes ?? 99;       // minutes for 1.6 km
  const exertion = b.walk_exertion ?? 10;

  let enduranceScore = 0;
  if (stair >= 120) enduranceScore += 2;
  else if (stair >= 60) enduranceScore += 1;
  if (walkPace <= 14 && exertion <= 6) enduranceScore += 2;
  else if (walkPace <= 18) enduranceScore += 1;

  // Strength band from squats to failure + wall sit.
  const squats = b.squat_reps ?? 0;
  const wallsit = b.wallsit_seconds ?? 0;
  let strengthScore = 0;
  if (squats >= 30) strengthScore += 2;
  else if (squats >= 15) strengthScore += 1;
  if (wallsit >= 75) strengthScore += 2;
  else if (wallsit >= 40) strengthScore += 1;

  return {
    band_endurance: bandLabel(enduranceScore),
    band_strength: bandLabel(strengthScore),
    // overall tier drives which plan template the person starts on
    tier: tierFrom(enduranceScore + strengthScore),
  };
}

function bandLabel(score) {
  if (score >= 3) return 'Trek-Ready';
  if (score >= 1) return 'Building';
  return 'Beginner';
}

function tierFrom(total) {
  if (total >= 6) return 'advanced';
  if (total >= 3) return 'intermediate';
  return 'beginner';
}

// --- Plan generation --------------------------------------------------------
// A plan is an array of 5 weeks. Each week is an array of 7 day objects.
// Day object: { day, focus, detail, pillar, rest }
// The beginner tier ramps gently in weeks 1-2 (sedentary-start injury guard).
// All tiers converge on a back-to-back long-day weekend in week 3-4 that
// simulates consecutive trek days, then taper in week 5.

const REST = (d) => ({ day: d, focus: 'Rest', detail: 'Full rest. Light stretching only. Recovery is training.', pillar: 'rest', rest: true });

function walk(d, min, note) {
  return { day: d, focus: `Brisk walk — ${min} min`, detail: note || 'Steady pace you can just hold a conversation at.', pillar: 'endurance', rest: false };
}
function strength(d, note) {
  return { day: d, focus: 'Leg & descent strength', detail: note, pillar: 'strength', rest: false };
}
function stairs(d, note) {
  return { day: d, focus: 'Stair / incline work', detail: note, pillar: 'incline', rest: false };
}
function loaded(d, min, kg, note) {
  return { day: d, focus: `Loaded walk — ${min} min, ${kg} kg pack`, detail: note || 'Wear your actual trek shoes and daypack. This is the closest thing to trek day.', pillar: 'load', rest: false };
}

// Beginner template — for a sedentary starting point.
function beginnerPlan() {
  return [
    // Week 1 — wake the body up. Low volume, build the habit.
    [
      walk(1, 25, 'Easy pace. Just move. Flat ground is fine.'),
      strength(2, '2 rounds: 8 bodyweight squats, 6 split squats per leg, 20 sec wall sit, 10 calf raises. Rest as needed.'),
      walk(3, 30),
      REST(4),
      stairs(5, '5 rounds of climbing 2-3 flights, walk down slowly. The slow down is descent training.'),
      walk(6, 35, 'Add a gentle incline if you can find one.'),
      REST(7),
    ],
    // Week 2 — add a little duration and a second strength day.
    [
      walk(1, 35),
      strength(2, '3 rounds: 10 squats, 8 split squats/leg, 30 sec wall sit, 12 calf raises, 8 slow step-downs/leg.'),
      stairs(3, '6 rounds of 3-4 flights, controlled descent each time.'),
      REST(4),
      strength(5, '3 rounds: 12 squats, 10 lunges/leg, 35 sec wall sit, 15 calf raises.'),
      walk(6, 50, 'Longest walk yet. Find some hills.'),
      REST(7),
    ],
    // Week 3 — first loaded walk, first taste of a long day.
    [
      loaded(1, 30, 4, 'Start light. 3-4 kg in your daypack.'),
      strength(2, '3 rounds: 15 squats, 12 lunges/leg, 45 sec wall sit, step-downs 12/leg, calf raises 20.'),
      stairs(3, '8 rounds of 4 flights with the daypack on (3-4 kg).'),
      REST(4),
      walk(5, 45, 'Brisk, hilly.'),
      loaded(6, 75, 5, 'Long loaded walk — the key session of the week. Hills, steady pace, 5 kg.'),
      REST(7),
    ],
    // Week 4 — peak. Back-to-back long days simulate consecutive trek days.
    [
      strength(1, '3 rounds: 15 squats, 15 lunges/leg, 60 sec wall sit, 15 step-downs/leg, 25 calf raises.'),
      loaded(2, 50, 6, 'Hilly, 6 kg.'),
      stairs(3, '10 rounds of 4-5 flights with 5 kg pack.'),
      REST(4),
      loaded(5, 90, 6, 'BACK-TO-BACK DAY 1. Long, hilly, 6 kg. Tired legs are the point.'),
      loaded(6, 75, 6, 'BACK-TO-BACK DAY 2. Go even though yesterday is in your legs — this is exactly trek reality.'),
      REST(7),
    ],
    // Week 5 — taper. Arrive fresh, not flat.
    [
      walk(1, 40, 'Easy, shake the legs out.'),
      strength(2, '2 light rounds only: 12 squats, 10 lunges/leg, 40 sec wall sit. Keep it crisp, not exhausting.'),
      loaded(3, 40, 5, 'Short and easy. Just rehearsing the pack.'),
      REST(4),
      walk(5, 30, 'Very easy.'),
      REST(6),
      { day: 7, focus: 'Travel / pre-trek rest', detail: 'You are ready. Hydrate well, sleep, pack. Trek starts June 29.', pillar: 'rest', rest: true },
    ],
  ];
}

// Intermediate template — for the "occasional walker" starting point.
function intermediatePlan() {
  return [
    [
      walk(1, 40),
      strength(2, '3 rounds: 12 squats, 10 split squats/leg, 40 sec wall sit, 10 step-downs/leg, 15 calf raises.'),
      stairs(3, '8 rounds of 4 flights, controlled descent.'),
      REST(4),
      walk(5, 50, 'Hilly.'),
      loaded(6, 45, 4, 'First loaded walk, 4 kg, hilly.'),
      REST(7),
    ],
    [
      strength(1, '3 rounds: 15 squats, 12 lunges/leg, 50 sec wall sit, 12 step-downs/leg, 20 calf raises.'),
      stairs(2, '10 rounds of 4-5 flights with 4 kg pack.'),
      walk(3, 60, 'Brisk, hilly.'),
      REST(4),
      strength(5, '3 rounds: 18 squats, 15 lunges/leg, 60 sec wall sit, 15 step-downs/leg.'),
      loaded(6, 75, 5, 'Long loaded walk, 5 kg, plenty of incline.'),
      REST(7),
    ],
    [
      loaded(1, 50, 6, 'Hilly, 6 kg.'),
      strength(2, '3 rounds: 20 squats, 15 lunges/leg, 70 sec wall sit, 18 step-downs/leg, 25 calf raises.'),
      stairs(3, '12 rounds of 5 flights with 6 kg pack.'),
      REST(4),
      walk(5, 50, 'Brisk recovery-ish, hilly.'),
      loaded(6, 110, 7, 'Long loaded walk — the key session. 7 kg, sustained climbs.'),
      REST(7),
    ],
    [
      strength(1, '3 rounds: 20 squats, 18 lunges/leg, 80 sec wall sit, 20 step-downs/leg, 30 calf raises.'),
      loaded(2, 60, 7, 'Hilly, 7 kg.'),
      stairs(3, '14 rounds of 5 flights, 6 kg pack, focus on smooth controlled descent.'),
      REST(4),
      loaded(5, 130, 8, 'BACK-TO-BACK DAY 1. Long, lots of climbing and descending, 8 kg.'),
      loaded(6, 100, 7, 'BACK-TO-BACK DAY 2. Go on tired legs — simulates summit day to Shea Goru.'),
      REST(7),
    ],
    [
      walk(1, 45, 'Easy.'),
      strength(2, '2 light rounds: 15 squats, 12 lunges/leg, 50 sec wall sit. Crisp, not draining.'),
      loaded(3, 45, 5, 'Short, easy, pack rehearsal.'),
      REST(4),
      walk(5, 35, 'Very easy.'),
      REST(6),
      { day: 7, focus: 'Travel / pre-trek rest', detail: 'You are ready. Hydrate, sleep, pack. Trek starts June 29.', pillar: 'rest', rest: true },
    ],
  ];
}

// Advanced template — kept for completeness if a baseline scores high.
function advancedPlan() {
  const p = intermediatePlan();
  // Bump loaded-walk durations and pack weights modestly.
  return p.map((week) =>
    week.map((d) => {
      if (d.pillar === 'load' && !d.rest) {
        return { ...d, focus: d.focus.replace(/(\d+) kg/, (m, n) => `${Number(n) + 1} kg`) };
      }
      return d;
    })
  );
}

export function generatePlan(tier) {
  if (tier === 'advanced') return advancedPlan();
  if (tier === 'intermediate') return intermediatePlan();
  return beginnerPlan();
}

// --- Readiness evaluation ---------------------------------------------------
// Called to give the go/no-go style read the user asked for.

export function evaluateReadiness({ baseline, checkins, plan, dayLogs }) {
  if (!baseline) return { level: 'unknown', message: 'Complete the baseline assessment first.' };

  const totalDays = plan ? plan.flat().filter((d) => !d.rest).length : 1;
  const doneDays = dayLogs ? dayLogs.filter((l) => l.completed).length : 0;
  const adherence = totalDays ? doneDays / totalDays : 0;

  const recentEffort = checkins?.length
    ? checkins[checkins.length - 1].effort_rating ?? 5
    : null;
  const anyPain = checkins?.some((c) => c.pain_flag);

  let level = 'building';
  let message = '';

  if (anyPain) {
    level = 'caution';
    message = 'A pain flag is logged. Address it before pushing volume — see a physio if it persists. Trek readiness depends on healthy knees.';
  } else if (adherence >= 0.8 && (recentEffort == null || recentEffort <= 7)) {
    level = 'on-track';
    message = 'Strong adherence and the load feels manageable. On track for a comfortable Hampta Pass. Keep the taper honest in week 5.';
  } else if (adherence >= 0.55) {
    level = 'building';
    message = 'Reasonable progress. Prioritise the loaded walks and the back-to-back weekend — those are the sessions that decide summit day.';
  } else {
    level = 'behind';
    message = 'Adherence is low for the time left. Protect the long loaded walks above all else, and consider easy daily walking to close the gap.';
  }

  return { level, message, adherence: Math.round(adherence * 100), doneDays, totalDays };
}
