// Smoke test for the pure corpus query layer.
import * as c from "./corpus.mjs";
import assert from "node:assert";

const meta = c.meta();
assert(meta.candidate_count > 0, "meta has candidates");
console.log("meta:", meta.candidate_count, "candidates,", meta.conditions.length, "conditions,", JSON.stringify(meta.tier_distribution));

const pmdd = c.list({ condition: "PMDD", limit: 100 });
console.log("PMDD candidates:", pmdd.total);

const strong = c.list({ tier: "strong", limit: 100 });
console.log("Strong tier (all conditions):", strong.total);

const offlabel = c.list({ regulatory: "off-label", limit: 5 });
console.log("Off-label sample:", offlabel.total, "→", offlabel.candidates.slice(0, 3).map((x) => `${x.drug}/${x.condition}`).join(", "));

const srch = c.search("aromatase endometriosis", 5);
console.log("search 'aromatase endometriosis':", srch.total, "→", srch.candidates.slice(0, 3).map((x) => x.drug).join(", "));

const first = pmdd.candidates[0];
const detail = c.get({ id: first.id });
assert(detail.candidate, "get by id works");
const ev = c.evidence({ id: first.id });
assert(ev.claims, "evidence returns claims");
console.log(`detail ${first.id}: ${detail.candidate.drug}/${detail.candidate.condition} tier=${detail.candidate.tier} score=${detail.candidate.score} claims=${ev.claims.length} dims=${ev.dimensions.length}`);

const cs = c.conditionSummary();
console.log("conditions in summary:", Object.keys(cs.conditions).join(", "));

console.log("\nALL TESTS PASSED");
