# HANDOFF — for Claude Cowork

You are deploying a finished web app for the user. The full source is in this
project folder. The app is built and verified — `npm run build` succeeds. Your
job is the deployment steps, which require accounts and credentials that only
the user has. **Do not rewrite the application code** unless a build error
forces a fix; the code is complete and tested.

## What this project is

A React + Vite PWA called "Hampta Pass Trek Trainer". It helps two people train
for a Himalayan trek (trek dates June 29 – July 3). Backend is Supabase
(Postgres + Auth + one Edge Function). The Edge Function calls the Anthropic
API to recalibrate the training plan weekly. Hosting target is Vercel.

## What you need FROM THE USER before starting

Ask the user for these and do not guess them:

1. Confirmation they have (or will create) a free **Supabase** account.
2. Confirmation they have (or will create) a free **Vercel** account.
3. An **Anthropic API key** (`sk-ant-...`). Do not proceed past the Edge
   Function step without it. Treat it as a secret — never print it, never
   commit it, never put it in frontend code or `.env`.
4. Whether they want it on **GitHub**. If yes, get the empty repo URL. If no,
   deploy straight from the folder with the Vercel CLI.

## Deployment sequence

### 1. Supabase project and schema
- Have the user create a Supabase project (or do it with their credentials if
  they grant access).
- Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor. This creates
  5 tables (`profiles`, `baselines`, `plans`, `day_logs`, `checkins`) and
  Row-Level-Security policies. Confirm all statements run without error.
- From **Project Settings -> API**, collect the **Project URL** and the
  **anon public** key.

### 2. Frontend env
- Copy `.env.example` to `.env`.
- Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the values above.
- The anon key is safe in the frontend by design (RLS protects the data). The
  Anthropic key is NOT — it must never go here.

### 3. Edge Function (the part holding the secret API key)
Run, substituting the user's values:
```
supabase login
supabase link --project-ref <PROJECT_REF>
supabase secrets set ANTHROPIC_API_KEY=<sk-ant-...>
supabase functions deploy recalibrate --no-verify-jwt
```
`<PROJECT_REF>` is the subdomain of the Supabase URL. Verify the function
appears as deployed in the Supabase dashboard under Edge Functions.

### 4. Verify build locally
```
npm install
npm run build
```
This must succeed. If it does, optionally run `npm run dev` and confirm the app
loads, an account can be created, and the baseline assessment saves a row in
the Supabase `baselines` table.

### 5. Deploy to Vercel
If no GitHub:
```
npm install -g vercel
vercel
```
Add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` when prompted (or
in the Vercel dashboard afterward), then:
```
vercel --prod
```
If using GitHub: init the repo, commit, push to the user's empty repo, then
import the repo in the Vercel dashboard and set the same two env vars there.

### 6. Hand back to the user
Give the user:
- The production URL.
- Instruction to open it on both phones and use "Add to Home Screen".
- A reminder that both people sign into the SAME app — they will each see both
  training tracks.

## Acceptance checks before you call it done

- [ ] `npm run build` exits 0.
- [ ] All `schema.sql` statements ran without error.
- [ ] The `recalibrate` Edge Function shows as deployed.
- [ ] `ANTHROPIC_API_KEY` is set as a Supabase secret, and appears NOWHERE in
      the repo, `.env`, or any committed file.
- [ ] The production URL loads, and sign-up creates a row in `profiles`.
- [ ] Completing the baseline assessment creates a row in `baselines` and a
      plan appears.

## Important constraints

- Do not commit `.env` — `.gitignore` already excludes it. Confirm it stays
  excluded.
- The Anthropic API key goes ONLY to `supabase secrets set`. If you ever see it
  about to land in a file or a git commit, stop.
- If `npm run build` fails, the most likely cause is a Node version below 18 —
  check `node -v` before debugging code.
- Do not change the training logic in `src/lib/training.js` or the plan
  content — it is intentionally calibrated to this specific trek.

## If the user asks what works without finishing every step

The app is fully usable after Steps 1–2 and 5 (Supabase + frontend + Vercel).
Only the weekly "Recalibrate (AI)" button needs Step 3. Everything else — the
baseline assessment, both 5-week plans, daily tracking, weekly check-ins, the
shared two-person view — works without the Edge Function.
