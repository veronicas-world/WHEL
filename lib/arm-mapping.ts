// Maps an arm/signal_type value to one of the THREE public-facing evidence arms.
// The substrate stores the arm directly ('direct' | 'pathway' | 'community'); the
// legacy subtype vocabulary is still recognized for any old consumers.
// (Cross-condition is no longer an arm — it is a derived-hypotheses lens.)

export type ArmKey = "direct" | "pathway" | "community";

const DIRECT_TYPES = new Set(["direct", "clinical_trial_finding", "review_article"]);
const PATHWAY_TYPES = new Set([
  "pathway", "pathway_signal", "side_effect_signal", "mechanism_overlap", "genetic_target_overlap",
]);
const COMMUNITY_TYPES = new Set(["community", "community_report"]);

export function toArmKey(raw: string | null | undefined): ArmKey | null {
  if (!raw) return null;
  const t = raw.toLowerCase().trim().replace(/[-\s]/g, "_");

  if (DIRECT_TYPES.has(t)) return "direct";
  if (PATHWAY_TYPES.has(t)) return "pathway";
  if (COMMUNITY_TYPES.has(t)) return "community";

  // Loose fallbacks — kept conservative so unknown values fail closed (null).
  if (t.includes("community") || t.includes("forum")) return "community";
  if (t.includes("pathway") || t.includes("mechanism") || t.includes("target_overlap") || t.includes("side_effect")) return "pathway";
  if (t.includes("direct") || t.includes("clinical_trial") || t.includes("review_article")) return "direct";

  return null;
}

export const ARM_LABELS: Record<ArmKey, string> = {
  direct:    "Direct research",
  pathway:   "Pathway insights",
  community: "Community reports",
};
