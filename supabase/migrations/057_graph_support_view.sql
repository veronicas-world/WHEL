-- 057_graph_support_view.sql
-- Path B disclosure layer: collapse the drug_targets x target_conditions
-- evidence-type duplication into one row per drug-condition pair, with the
-- shared targets aggregated. This is what the gated CandidateCard reads to
-- show "graph supports, via <target>" vs "graph silent".
--
-- A drug-condition pair appears here iff there exists at least one target T
-- such that the drug acts on T (drug_targets) AND T is associated with the
-- condition (target_conditions). via_targets is the set of those shared
-- targets (HGNC symbols). Pairs with no shared target are absent => "silent".

create or replace view graph_support as
select
  dt.compound_id,
  tc.condition_id,
  array_agg(distinct t.hgnc_symbol order by t.hgnc_symbol)
    filter (where t.hgnc_symbol is not null)            as via_targets,
  count(distinct dt.target_id)                          as via_target_count,
  max(tc.overall_score)                                 as best_association_score
from drug_targets dt
join target_conditions tc on tc.target_id = dt.target_id
join targets t            on t.id         = dt.target_id
group by dt.compound_id, tc.condition_id;

grant select on graph_support to anon, authenticated;
