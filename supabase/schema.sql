-- ===========================================================================
-- Hampta Pass Trek Trainer — database schema
-- Paste this whole file into the Supabase SQL Editor and click "Run".
-- ===========================================================================

-- Profiles: one row per trekker (you and your husband).
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at  timestamptz default now()
);

-- Baseline fitness assessment: one row per person.
create table if not exists baselines (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  stair_seconds   int,        -- continuous stair climb, seconds
  walk_minutes    numeric,    -- timed 1.6 km brisk walk, minutes
  walk_exertion   int,        -- how winded, 1-10
  squat_reps      int,        -- bodyweight squats to form failure
  wallsit_seconds int,        -- wall sit hold, seconds
  band_endurance  text,       -- Beginner / Building / Trek-Ready
  band_strength   text,
  assessed_at     timestamptz default now(),
  unique (user_id)
);

-- The generated 5-week plan, stored as JSON per person so it can evolve.
create table if not exists plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  plan_json   jsonb not null,   -- array of weeks -> array of day objects
  version     int default 1,
  updated_at  timestamptz default now(),
  unique (user_id)
);

-- Daily completion log: one row per person per planned day.
create table if not exists day_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  week_num    int not null,
  day_num     int not null,
  completed   boolean default false,
  note        text,
  logged_at   timestamptz default now(),
  unique (user_id, week_num, day_num)
);

-- Weekly check-ins that feed the adaptive recalibration.
create table if not exists checkins (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  week_num        int not null,
  sessions_done   int,
  effort_rating   int,        -- how hard the week felt, 1-10
  soreness        int,        -- 1-10
  pain_flag       boolean default false,
  pain_note       text,
  created_at      timestamptz default now(),
  unique (user_id, week_num)
);

-- ---------------------------------------------------------------------------
-- Row Level Security: everyone signed into THIS project can read both tracks
-- (so you and your husband see each other), but each person writes only their
-- own rows.
-- ---------------------------------------------------------------------------
alter table profiles  enable row level security;
alter table baselines enable row level security;
alter table plans     enable row level security;
alter table day_logs  enable row level security;
alter table checkins  enable row level security;

-- Read: any authenticated user can read all rows (shared two-person view).
create policy "read all profiles"  on profiles  for select to authenticated using (true);
create policy "read all baselines" on baselines for select to authenticated using (true);
create policy "read all plans"     on plans     for select to authenticated using (true);
create policy "read all daylogs"   on day_logs  for select to authenticated using (true);
create policy "read all checkins"  on checkins  for select to authenticated using (true);

-- Write: a user can only insert/update/delete rows that are theirs.
create policy "write own profile"  on profiles  for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "write own baseline" on baselines for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "write own plan"     on plans     for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "write own daylog"   on day_logs  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "write own checkin"  on checkins  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
