// Shared, presentation-only helpers for the regulatory & development-status
// layers (FDA Orange Book supply + DailyMed approved-indication). Both the
// candidate card and the signal detail page import these so they describe the
// same data with identical language. Nothing here is regulatory advice — every
// string is descriptive US regulatory-landscape context.

import type { Candidate } from "@/app/components/CandidateCard";

export type OrangeBook = NonNullable<Candidate["orangeBook"]>;
export type Indication = NonNullable<Candidate["indication"]>;
export type Supply = OrangeBook["supply"];
export type Relationship = Indication["label_relationship"];

// ── Supply (per molecule, FDA Orange Book) ───────────────────────────────────

export function supplyLabel(supply: Supply): string {
  switch (supply) {
    case "generic": return "Generic available";
    case "brand_patented": return "Brand-only, patent-protected";
    case "brand_only": return "Brand-only";
    case "discontinued": return "Discontinued";
    case "combination_only": return "Only in combination products";
    case "not_listed": return "Not in the Orange Book";
  }
}

// A one-sentence plain-language gloss of what each supply state means.
export function supplyGloss(ob: OrangeBook): string {
  switch (ob.supply) {
    case "generic":
      return "A live ANDA lists this active ingredient, so the basic molecule is available as a generic (off-patent in its basic form).";
    case "brand_patented":
      return ob.latest_patent_expiry
        ? `Single-source brand with at least one unexpired Orange Book patent (latest listed expiry ${formatDate(ob.latest_patent_expiry)}).`
        : "Single-source brand with an unexpired Orange Book patent.";
    case "brand_only":
      return "Single-source brand with no unexpired Orange Book patent currently listed.";
    case "discontinued":
      return "Previously approved but no longer actively marketed in the Orange Book.";
    case "combination_only":
      return "Appears only inside combination products, not as a stand-alone single-ingredient product.";
    case "not_listed":
      return "Absent from the Orange Book. Biologics (listed in the Purple Book instead), dietary supplements, and drugs not FDA-approved in the US do not appear here.";
  }
}

export function supplyDot(supply: Supply): string {
  switch (supply) {
    case "generic": return "var(--green-deep)";
    case "brand_patented": return "var(--brick)";
    case "brand_only": return "var(--moss)";
    case "discontinued": return "var(--brick)";
    case "combination_only": return "var(--moss)";
    case "not_listed": return "var(--ink)";
  }
}

// ── Indication relationship (per pair, DailyMed) ─────────────────────────────

export function relationshipLabel(rel: Relationship): string {
  switch (rel) {
    case "on_label": return "On-label (FDA-approved for this use)";
    case "off_label": return "Off-label";
    case "no_fda_label": return "No FDA-approved label";
  }
}

export function relationshipGloss(ind: Indication): string {
  switch (ind.label_relationship) {
    case "on_label":
      return "This condition appears in the drug's FDA-approved label (Indications & Usage), so using it here is an approved, on-label use.";
    case "off_label":
      return "The drug has an FDA-approved label, but for a different indication, so using it for this condition would be off-label.";
    case "no_fda_label":
      return "No FDA-approved drug label was found for this molecule (it may be a supplement, a biologic, investigational, or approved only outside the US), so any use here is investigational.";
  }
}

export function relationshipDot(rel: Relationship): string {
  switch (rel) {
    case "on_label": return "var(--green-deep)";
    case "off_label": return "var(--moss)";
    case "no_fda_label": return "var(--ink)";
  }
}

// A compact chip label that leads with the most salient regulatory fact.
export function regulatoryChipLabel(c: Candidate): string | null {
  const ind = c.indication;
  const ob = c.orangeBook;
  if (ind?.label_relationship === "on_label") return "On-label";
  if (ind?.label_relationship === "off_label") {
    return ob?.generic_available ? "Off-label · generic" : "Off-label";
  }
  if (ind?.label_relationship === "no_fda_label") return "Investigational";
  // No indication record but we do have supply context.
  if (ob) return ob.generic_available ? "Generic" : supplyLabel(ob.supply);
  return null;
}

export function regulatoryChipDot(c: Candidate): string {
  if (c.indication) return relationshipDot(c.indication.label_relationship);
  if (c.orangeBook) return supplyDot(c.orangeBook.supply);
  return "var(--ink)";
}

// ── small date helper (Orange Book patent expiry is ISO yyyy-mm-dd) ──────────
export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", timeZone: "UTC" });
}
