-- 034_drop_unused_cross_condition_patterns.sql
-- Minor finding M2 (Independent Review, May 2026): the cross_condition_patterns
-- table was declared in 001_initial_schema.sql but is never populated and is
-- never read by any application code.
--
-- A live check confirms the table contains 0 rows. It is referenced only in:
--   * 001_initial_schema.sql  (the CREATE TABLE statement)
--   * docs/methods-draft.md   (listed among the "core tables")
--
-- No page, query, or pipeline script reads or writes it. Carrying an empty,
-- unused table invites confusion -- a reader of the schema reasonably assumes
-- it holds data feeding the product. This migration removes it. CASCADE drops
-- any dependent objects (none expected, since nothing references it).
--
-- This is a schema-hygiene change only: no signal, source, compound or
-- condition data is touched. methods-draft.md is updated in the same review
-- pass to describe four core tables rather than five.
--
-- If cross-condition pattern analysis is revived later, it should be
-- reintroduced with a fresh schema and a pipeline that actually fills it.
--
-- Generated: 2026-05-24

DROP TABLE IF EXISTS cross_condition_patterns CASCADE;

-- Verification: should return 0 rows (the table should no longer exist).
--
-- SELECT to_regclass('public.cross_condition_patterns');   -- expect NULL
