-- ================================================================
-- 028 — Add key_facts JSONB column to conditions
-- ================================================================
-- Three short, scannable facts per condition for the detail-page hero.
-- Each fact has a mono uppercase `label` and a short `value`.
-- Numbers and language are grounded in the prose set by migration 012.
-- Ranges use "to" rather than en/em dashes to match the rest of the
-- condition copy (see migration 013_remove_dashes_from_data.sql).
-- ================================================================

BEGIN;

ALTER TABLE conditions
  ADD COLUMN IF NOT EXISTS key_facts jsonb;

COMMENT ON COLUMN conditions.key_facts IS
  'Ordered array of {label, value} pairs for the condition detail hero. Render in order; expect exactly 3 entries.';

-- ── Endometriosis ──────────────────────────────────────────────────
UPDATE conditions SET key_facts = '[
  {"label": "PREVALENCE",        "value": "10 to 15% of reproductive-age women"},
  {"label": "DIAGNOSTIC DELAY",  "value": "7 to 10 years on average"},
  {"label": "APPROVED THERAPY",  "value": "No cure; hormonal suppression only"}
]'::jsonb
WHERE slug = 'endometriosis';

-- ── PMDD ───────────────────────────────────────────────────────────
UPDATE conditions SET key_facts = '[
  {"label": "PREVALENCE",        "value": "3 to 8% of menstruating women"},
  {"label": "DSM RECOGNITION",   "value": "Distinct diagnosis only since 2013"},
  {"label": "APPROVED THERAPY",  "value": "SSRIs and one oral contraceptive"}
]'::jsonb
WHERE slug = 'pmdd';

-- ── PCOS ───────────────────────────────────────────────────────────
UPDATE conditions SET key_facts = '[
  {"label": "PREVALENCE",        "value": "6 to 12% of reproductive-age women"},
  {"label": "CLINICAL IMPACT",   "value": "Leading cause of anovulatory infertility"},
  {"label": "APPROVED THERAPY",  "value": "None FDA-approved for PCOS"}
]'::jsonb
WHERE slug = 'pcos';

-- ── Adenomyosis ────────────────────────────────────────────────────
UPDATE conditions SET key_facts = '[
  {"label": "PREVALENCE",        "value": "10 to 25% of women"},
  {"label": "AMONG SEVERE PAIN", "value": "40 to 50% of women with severe period pain"},
  {"label": "APPROVED THERAPY",  "value": "Hysterectomy is the only definitive cure"}
]'::jsonb
WHERE slug = 'adenomyosis';

-- ── Vulvodynia ─────────────────────────────────────────────────────
UPDATE conditions SET key_facts = '[
  {"label": "PREVALENCE",        "value": "8 to 16% lifetime prevalence"},
  {"label": "DIAGNOSTIC DELAY",  "value": "3 to 5 years to correct diagnosis"},
  {"label": "APPROVED THERAPY",  "value": "No FDA-approved treatment"}
]'::jsonb
WHERE slug = 'vulvodynia';

-- ── Perimenopause & Menopause ──────────────────────────────────────
UPDATE conditions SET key_facts = '[
  {"label": "PREVALENCE",        "value": "Universal in women with ovaries"},
  {"label": "VASOMOTOR SYMPTOMS","value": "70 to 80% experience hot flashes"},
  {"label": "SYMPTOM DURATION",  "value": "Median 7 to 10 years"}
]'::jsonb
WHERE slug = 'perimenopause-menopause';

-- ── Verification: every active condition should have 3 facts ───────
-- Run this after the UPDATEs above to confirm:
--   SELECT slug, jsonb_array_length(key_facts) AS n
--   FROM conditions
--   ORDER BY slug;
-- Expected: 3 rows per condition above.

COMMIT;
