-- 056_fix_menopause_mondo.sql
--
-- Path A cleanup. The `perimenopause-menopause` condition row never got its MONDO
-- id backfilled: migration 051 (generated from lib/conditions-ontology.json) matched
-- on the slug `menopause`, while the live row's slug is `perimenopause-menopause`,
-- so the UPDATE was a no-op and the row was left with mondo_id = NULL.
--
-- This backfills it for canonical-id completeness, so all six conditions now carry a
-- canonical disease id. No EFO id is set on purpose: Open Targets has no menopause
-- disease entity (only menopause-age traits), so the knowledge graph stays correctly
-- "silent" for this condition.
--
-- Idempotent (guarded). Apply after 050 and 051.

update conditions
set mondo_id = 'MONDO:0001119'
where slug = 'perimenopause-menopause' and mondo_id is null;
