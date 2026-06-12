-- ============================================================
-- 049_access_requests.sql
-- Request Access waitlist — lead capture for the research preview
-- ============================================================
--
-- Backs the /access page. Whoever requests access to the gated product (the full
-- candidate index + substrate) lands here; this is the sales / advisor / grant
-- pipeline. Additive; touches nothing else. Apply in Supabase Studio.
--
-- No RLS is enabled, matching the other public tables in this project, so the
-- anon key (used by the public form) can insert. The data is low-sensitivity
-- contact info; tighten with an insert-only RLS policy when convenient.

create extension if not exists pgcrypto;

create table if not exists access_requests (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  email         text not null,
  role          text,          -- e.g. clinician-researcher, pharma R&D, advocacy, investor
  institution   text,
  intended_use  text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_access_requests_created on access_requests(created_at desc);

-- Verify after apply:
--   select count(*) from access_requests;
