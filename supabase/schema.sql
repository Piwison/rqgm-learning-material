-- WorkTracker · eval-aware schema
-- Apply in Supabase → SQL Editor, or via the Supabase MCP `apply_migration`.
--
-- Design note: these five tables serve BOTH purposes at once. `tasks` is the
-- productivity tracker; everything else is the evaluation loop. The dashboard
-- reads across both.

-- ─────────────────────────────────────────────────────────────
-- 1. tasks — synced from Notion [PF] Tasks Database
-- ─────────────────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  status      text,
  priority    text,
  label       text,
  due_date    date,
  done        boolean default false,
  source      text default 'notion',
  notion_id   text unique,
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. rubrics — versioned. Exactly one active per name.
-- ─────────────────────────────────────────────────────────────
create table if not exists rubrics (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  version       int  not null,
  criteria_json jsonb not null,   -- array of binary criteria
  active        boolean default false,
  created_at    timestamptz default now(),
  unique (name, version)
);

-- enforce "one active rubric per name"
create unique index if not exists rubrics_one_active
  on rubrics (name) where active;

-- ─────────────────────────────────────────────────────────────
-- 3. eval_cases — the golden set. Anchors are APPEND-ONLY.
-- ─────────────────────────────────────────────────────────────
create table if not exists eval_cases (
  id               uuid primary key default gen_random_uuid(),
  case_ref         text,           -- e.g. 'TBD-MV-03'
  input            text,
  expected_verdict text check (expected_verdict in ('accept','reject')),
  is_anchor        boolean default false,
  is_adversarial   boolean default false,  -- added during epoch transitions
  source           text,
  note             text,           -- required if an anchor label is ever revised
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 4. agent_runs — one row per (case × rubric version × judge run)
-- ─────────────────────────────────────────────────────────────
create table if not exists agent_runs (
  id                 uuid primary key default gen_random_uuid(),
  agent_name         text,
  input_ref          uuid references eval_cases(id) on delete cascade,
  rubric_version     int,
  model_used         text,          -- which judge actually scored this
  verdict            text check (verdict in ('accept','reject')),
  score              numeric,
  per_criterion_json jsonb,         -- {criterion: pass|fail}
  evidence_json      jsonb,         -- {criterion: "<quoted text>"}
  order_variant      text,          -- 'ab' | 'ba' — for position-bias control
  tokens_in          int,
  tokens_out         int,
  cost_usd           numeric,
  stale              boolean default false,  -- selective erasure flag
  created_at         timestamptz default now()
);

create index if not exists agent_runs_case_idx    on agent_runs (input_ref);
create index if not exists agent_runs_version_idx on agent_runs (rubric_version);
create index if not exists agent_runs_fresh_idx   on agent_runs (created_at) where not stale;

-- ─────────────────────────────────────────────────────────────
-- 5. epoch_transitions — the audit trail for rubric promotions
-- ─────────────────────────────────────────────────────────────
create table if not exists epoch_transitions (
  id                uuid primary key default gen_random_uuid(),
  rubric_name       text,
  from_version      int,
  to_version        int,
  anchor_kappa_from numeric,
  anchor_kappa_to   numeric,
  promoted          boolean,        -- true only if kappa_to >= kappa_from
  n_anchors         int,
  n_marked_stale    int,
  notes             text,
  created_at        timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- Convenience view: current, trusted results only
-- ─────────────────────────────────────────────────────────────
create or replace view v_current_runs as
select r.*, c.case_ref, c.expected_verdict, c.is_anchor
from   agent_runs r
join   eval_cases c on c.id = r.input_ref
where  not r.stale;
