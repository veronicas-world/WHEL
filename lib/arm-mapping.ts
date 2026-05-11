// Shared mapping from internal signal_type values (8 subtypes) to the
// 4 public-facing evidence arms. Used by app/page.tsx, scripts/dump-counts.mjs,
// and any other consumer that needs to roll subtypes up to arms.
//
// Internal signal_type vocabulary (per DB):
//   clinical_trial_finding, review_article     → direct
//   cross_condition_signal                     → cross
//   pathway_signal, side_effect_signal,
//   mechanism_overlap, genetic_target_overlap  → pathway
//   community_report                           → community

export type ArmKey = "direct" | "cross" | "pathway" | "community";

const DIRECT_TYPES = new Set([
  "clinical_trial_finding",
  "review_article",
]);

const CROSS_TYPES = new Set([
  "cross_condition_signal",
]);

const PATHWAY_TYPES = new Set([
  "pathway_signal",
  "side_effect_signal",
  "mechanism_overlap",
  "genetic_target_overlap",
]);

const COMMUNITY_TYPES = new Set([
  "community_report",
]);

export function toArmKey(raw: string | null | undefined): ArmKey | null {
  if (!raw) return null;
  const t = raw.toLowerCase().trim().replace(/[-\s]/g, "_");

  if (DIRECT_TYPES.has(t)) return "direct";
  if (CROSS_TYPES.has(t)) return "cross";
  if (PATHWAY_TYPES.has(t)) return "pathway";
  if (COMMUNITY_TYPES.has(t)) return "community";

  // Loose fallbacks for any future variants — kept conservative so unknown
  // values fail closed (return null) rather than silently mis-bucketing.
  if (t.includes("community") || t.includes("forum")) return "community";
  if (t.includes("cross_condition")) return "cross";
  if (t.includes("pathway") || t.includes("mechanism") || t.includes("target_overlap") || t.includes("side_effect")) return "pathway";
  if (t.includes("clinical_trial") || t.includes("review_article")) return "direct";

  return null;
}

export const ARM_LABELS: Record<ArmKey, string> = {
  direct:    "Direct Research",
  cross:     "Cross-Condition Signals",
  pathway:   "Pathway Insights",
  community: "Community Forum Reports",
};
