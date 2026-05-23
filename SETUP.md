# Hampta Pass Trek Trainer — Setup Guide

A two-person, installable PWA that builds a personalised 5-week training plan
for the Hampta Pass trek (June 29 – July 3), tracks daily progress in a shared
database, and recalibrates each week using the Claude API.

If you are handing this to **Claude Cowork**, give it `HANDOFF.md` instead —
that file is written as direct instructions for an agent. This file is the
human explanation of the same steps.

---

## What the app does

- **Baseline assessment** — 5 measured tests (stair climb, timed walk, walk
  exertion, squats to failure, wall sit) score each person into readiness
  bands. The plan is generated from real numbers, not self-reported labels.
- **Two calibrated tracks** — each person gets their own 5-week plan sized to
  their baseline. Sedentary and occasional-walker starts ramp differently.
- **Shared database** — both trekkers sign into the same Supabase project and
  see both tracks.
- **Adaptive recalibration** — each week you log a check-in; the "Recalibrate"
  button calls the Claude API (via a Supabase Edge Function that holds the API
  key securely) and rewrites that week based on how training is going.
- **Installable PWA** — works in any mobile/desktop browser and installs to the
  home screen.

---

## Prerequisites

- Node.js 18+ and npm
- A free Supabase account — https://supabase.com
- An Anthropic API key — https://console.anthropic.com
- A free Vercel account — https://vercel.com (for hosting)
- The Supabase CLI — https://supabase.com/docs/guides/cli (for the Edge Function)

---

## Step 1 — Supabase project + database

1. Create a new project at https://supabase.com/dashboard. Pick any region and
   set a database password.
2. When it finishes provisioning, open **SQL Editor**, click **New query**,
   paste the entire contents of `supabase/schema.sql`, and click **Run**. This
   creates the five tables and their security policies.
3. Open **Project Settings -> API**. Copy two values:
   - **Project URL**
   - **anon / public** key

## Step 2 — Frontend environment

1. In the project folder, copy `.env.example` to `.env`.
2. Paste the two values from Step 1 into `.env`:
   ```
   VITE_SUPABASE_URL=https://your-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 3 — Deploy the recalibration Edge Function

This is what holds the Anthropic API key securely (never in the browser).

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
supabase functions deploy recalibrate --no-verify-jwt
```

> `YOUR-PROJECT-REF` is the part of your Supabase URL before `.supabase.co`.

## Step 4 — Run locally to test

```bash
npm install
npm run dev
```

Open the printed URL. Create an account, set a display name, and complete the
baseline assessment. Have your husband do the same from his own device or
browser — same app, same Supabase project — and you will each see both tracks.

## Step 5 — Deploy the PWA to Vercel

Easiest path, no GitHub required:

```bash
npm install -g vercel
vercel
```

Follow the prompts. When asked, add the two environment variables
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) — or add them later in the
Vercel dashboard under **Settings -> Environment Variables**, then redeploy.

To deploy the production version:

```bash
vercel --prod
```

Open the production URL on each phone and use the browser's **Add to Home
Screen** option to install it as an app.

---

## Using the app each week

1. Tick off training days as you complete them.
2. At the end of each week, tap **Log week check-in** — sessions done, how hard
   it felt, soreness, and a pain flag if anything hurt.
3. Tap **Recalibrate this week (AI)** to have Claude adjust the upcoming week
   based on that check-in. If someone flags pain, recalibration backs off load
   and adds recovery.

The readiness banner at the top gives each person an honest on-track / behind /
caution read against the June 29 trek date.

---

## Notes & honest limitations

- **Altitude can't be trained at home.** This plan builds fitness; on-trek
  acclimatisation is handled by pacing and hydration.
- **Break in your trek shoes now** and wear them for every loaded walk.
- If the Edge Function isn't deployed, everything still works except the AI
  recalibrate button — the full generated 5-week plan, tracking, check-ins, and
  the shared database all function without it.
- Free Supabase projects pause after a week of inactivity; just unpause from
  the dashboard if that happens.

---

## Project structure

```
hampta-tracker/
  index.html
  package.json
  vite.config.js            PWA config
  .env.example              copy to .env
  src/
    main.jsx
    App.jsx                 auth gate + routing + shared data load
    styles.css
    lib/
      supabase.js           Supabase client
      training.js           baseline scoring + 5-week plan generator
    components/
      Auth.jsx              sign in / sign up / profile
      Assessment.jsx        the 5-test baseline
      PlanView.jsx          weeks, day logging, check-ins, recalibration
  supabase/
    schema.sql              run this in the SQL editor
    functions/recalibrate/
      index.ts              Edge Function calling the Claude API
  public/
    favicon.svg, icon-192.png, icon-512.png
```
