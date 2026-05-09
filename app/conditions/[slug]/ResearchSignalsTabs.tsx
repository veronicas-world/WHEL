"use client";

import { useState } from"react";
import ExternalLinkIcon from"../../components/ExternalLinkIcon";

interface Source {
 id: string;
 source_type: string | null;
 external_id: string | null;
 title: string | null;
 authors: string | null;
 journal: string | null;
 publication_date: string | null;
 url: string | null;
 key_finding_excerpt: string | null;
}

export interface Signal {
 id: string;
 signal_type: string | null;
 evidence_strength: string | null;
 confidence_tier: string | null;
 replication_score: number | null;
 source_quality_score: number | null;
 specificity_score: number | null;
 plausibility_score: number | null;
 direction_score: number | null;
 total_evidence_score: number | null;
 effect_direction: string | null;
 replication_level: string | null;
 plausibility_level: string | null;
 summary: string | null;
 mechanism_hypothesis: string | null;
 status: string | null;
 compounds: {
 name: string;
 generic_name: string | null;
 drug_class: string | null;
 fda_status: string | null;
 } | null;
 sources: Source[];
}

// Evidence badge: sage green bg + white text, UPPERCASE +"EVIDENCE" suffix
function EvidenceBadge({ strength }: { strength: string | null }) {
 const key = (strength ??"").toLowerCase();

 const configs: Record<string, { label: string; bg: string; color: string; border?: string }> = {
 strong: { label:"STRONG EVIDENCE", bg:"#5C6B5D", color:"#fff" },
 moderate: { label:"MODERATE EVIDENCE", bg:"#7A8B7A", color:"#fff" },
 preliminary: {
 label:"PRELIMINARY EVIDENCE",
 bg:"#EEF1EE",
 color:"#5C6B5D",
 border:"#7A8B7A",
 },
 };

 const config = configs[key] ?? {
 label: (strength ??"UNKNOWN").toUpperCase(),
 bg:"#EEF1EE",
 color:"#5C6B5D",
 border:"#7A8B7A",
 };

 return (
 <span
 className="text-[10px] font-bold px-2.5 py-1 tracking-wider whitespace-nowrap"
 style={{
 backgroundColor: config.bg,
 color: config.color,
 border: config.border ? `1px solid ${config.border}` : undefined,
 }}
 >
 {config.label}
 </span>
 );
}

// Confidence tier badge — replaces EvidenceBadge on new scored signals
function ConfidenceTierBadge({ tier }: { tier: string | null }) {
 if (!tier) return null;
 const configs: Record<string, { bg: string; color: string; border?: string }> = {
 Strong:      { bg: "#5C6B5D", color: "#fff" },
 Moderate:    { bg: "#7A8B7A", color: "#fff" },
 Emerging:    { bg: "#EEF1EE", color: "#5C6B5D", border: "#7A8B7A" },
 Exploratory: { bg: "#F5F3EF", color: "#777", border: "#C8C3BB" },
 };
 const cfg = configs[tier] ?? { bg: "#EEF1EE", color: "#5C6B5D", border: "#7A8B7A" };
 return (
 <span
 className="text-[10px] font-bold px-2.5 py-1 tracking-wider whitespace-nowrap uppercase"
 style={{ backgroundColor: cfg.bg, color: cfg.color, border: cfg.border ? `1px solid ${cfg.border}` : undefined }}
 >
 {tier}
 </span>
 );
}

// Score pip row: 0–2 filled dots
function ScorePips({ value, max = 2 }: { value: number | null; max?: number }) {
 if (value == null) return null;
 return (
 <span className="flex gap-0.5 items-center">
 {Array.from({ length: max }, (_, i) => (
 <span
 key={i}
 style={{
 width: 6, height: 6, borderRadius: "50%",
 backgroundColor: i < value ? "#5C6B5D" : "#D6D1C9",
 display: "inline-block",
 }}
 />
 ))}
 </span>
 );
}

// Effect direction pill
function EffectDirectionPill({ direction }: { direction: string | null }) {
 if (!direction || direction === "unclear") return null;
 const label: Record<string, string> = {
 improves: "Improves condition",
 worsens:  "May worsen condition",
 mixed:    "Mixed effects",
 };
 const color: Record<string, string> = {
 improves: "#4D5E4D",
 worsens:  "#8B4513",
 mixed:    "#7A6B4D",
 };
 return (
 <span
 className="text-[10px] font-semibold px-2 py-0.5 tracking-wide"
 style={{ backgroundColor: "#F5F3EF", color: color[direction] ?? "#777", border: "1px solid #E0DDD8" }}
 >
 {label[direction] ?? direction}
 </span>
 );
}

// Derive a display label from a signal's sources array
function getSourceLabel(sources: Source[]): string | null {
 const types = new Set(sources.map((s) => s.source_type));
 if (types.has("faers")) return "FDA AEMS";
 if (types.has("pubmed")) return "PubMed";
 if (types.has("opentargets")) return "Open Targets";
 return null;
}

// Small source badge shown on signal cards
// For Open Targets sources, renders as a link to the evidence page.
function SourceBadge({ sources }: { sources: Source[] }) {
 const label = getSourceLabel(sources);
 if (!label) return null;

 const badgeStyle = {
   backgroundColor: "#F0EDE8",
   color: "#111",
   border: "1px solid #E0DDD8",
 };
 const className = "text-[10px] font-semibold px-2 py-0.5 tracking-wide whitespace-nowrap";

 if (label === "Open Targets") {
   const otSource = sources.find((s) => s.source_type === "opentargets");
   const url = otSource?.url ?? "https://platform.opentargets.org";
   return (
     <a
       href={url}
       target="_blank"
       rel="noopener noreferrer"
       className={className}
       style={{ ...badgeStyle, textDecoration: "none" }}
     >
       Source: {label} <ExternalLinkIcon />
     </a>
   );
 }

 return (
   <span className={className} style={badgeStyle}>
     Source: {label}
   </span>
 );
}

// Section field label inside cards
function FieldLabel({ children }: { children: React.ReactNode }) {
 return (
 <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color:"#111" }}>
 {children}
 </p>
 );
}

// Collapsible citations with configurable colors.
// PubMed sources render as linked paper titles with authors/journal.
// AEMS sources render as reaction-category rows with report counts.
function CollapsibleSources({
 sources,
 linkColor ="#7A8B7A",
 textColor ="#666",
 mutedColor ="#999",
 borderColor ="#E0DDD8",
}: {
 sources: Source[];
 linkColor?: string;
 textColor?: string;
 mutedColor?: string;
 borderColor?: string;
}) {
 const [open, setOpen] = useState(false);
 if (!sources.length) return null;

 // Deduplicate by URL — keep first occurrence of each URL
 const seenUrls = new Set<string>();
 const dedupedSources = sources.filter((s) => {
 if (!s.url) return true;
 if (seenUrls.has(s.url)) return false;
 seenUrls.add(s.url);
 return true;
 });

 const pubmedSources = dedupedSources.filter((s) => s.source_type === "pubmed");
 const faersSources = dedupedSources.filter((s) => s.source_type === "faers");
 const redditSources = dedupedSources.filter((s) => s.source_type === "reddit");
 const otSources = dedupedSources.filter((s) => s.source_type === "opentargets");
 const otherSources = dedupedSources.filter(
   (s) =>
     s.source_type !== "pubmed" &&
     s.source_type !== "faers" &&
     s.source_type !== "reddit" &&
     s.source_type !== "opentargets"
 );

 return (
 <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
 <button
 onClick={() => setOpen(!open)}
 className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
 style={{ color: linkColor }}
 >
 <svg
 width="12"
 height="12"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2.5"
 strokeLinecap="round"
 strokeLinejoin="round"
 style={{
 transform: open ?"rotate(180deg)" :"none",
 transition:"transform 0.15s",
 }}
 >
 <polyline points="6 9 12 15 18 9" />
 </svg>
 {open ?"Hide" :"View"} Citations ({dedupedSources.length})
 </button>

 {open && (
 <div className="mt-3 space-y-4">

 {/* PubMed sources */}
 {pubmedSources.length > 0 && (
 <div>
 {(faersSources.length > 0 || otSources.length > 0 || otherSources.length > 0) && (
 <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: mutedColor }}>
 Published Research
 </p>
 )}
 <ul className="space-y-3">
 {pubmedSources.map((source) => (
 <li key={source.id} className="text-xs leading-relaxed" style={{ color: textColor }}>
 {source.url ? (
 <a
 href={source.url}
 target="_blank"
 rel="noopener noreferrer"
 className="font-medium hover:underline underline-offset-2"
 style={{ color: linkColor }}
 >
 {source.title ?? source.external_id ?? source.url}
 </a>
 ) : (
 <span className="font-medium" style={{ color:"#333" }}>
 {source.title ?? source.external_id ??"Source"}
 </span>
 )}
 {source.authors && (
 <span style={{ color: mutedColor }}> · {source.authors}</span>
 )}
 {source.journal && (
 <span style={{ color: mutedColor }} className="italic">
 , {source.journal}
 </span>
 )}
 {source.publication_date && (
 <span style={{ color: mutedColor }}>
 {""}({source.publication_date.slice(0, 4)})
 </span>
 )}
 {source.external_id && (
 <a
 href={`https://pubmed.ncbi.nlm.nih.gov/${source.external_id}`}
 target="_blank"
 rel="noopener noreferrer"
 className="ml-1 hover:underline underline-offset-2"
 style={{ color: mutedColor }}
 >
 · PMID {source.external_id}
 </a>
 )}
 {source.key_finding_excerpt && (
 <p className="mt-1.5 italic leading-relaxed" style={{ color: mutedColor }}>
 &ldquo;{source.key_finding_excerpt}&rdquo;
 </p>
 )}
 </li>
 ))}
 </ul>
 </div>
 )}

 {/* AEMS sources: query summary + reaction categories with counts */}
 {faersSources.length > 0 && (
 <div>
 <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: mutedColor }}>
 FDA Adverse Event Monitoring System (AEMS)
 </p>
 {(() => {
 const querySummary = faersSources.find((s) =>
 (s.external_id ??"").startsWith("FAERS-QUERY-")
 );
 const reactionRows = faersSources.filter((s) =>
 !(s.external_id ??"").startsWith("FAERS-QUERY-")
 );
 return (
 <>
 {/* Volume summary row */}
 {querySummary && (
 <div
 className=" px-3 py-2 mb-2 text-xs leading-snug"
 style={{ backgroundColor:"#F5F3EF", border:"1px solid #E0DDD8", color: textColor }}
 >
 <span style={{ color: mutedColor }}>
 {/* Strip stored "FDA FAERS/AEMS Database Query:" prefix for a tighter label */}
 {(querySummary.title ??"").replace(/^FDA (FAERS|AEMS) Database Query:\s*/i,"")}
 </span>
 {querySummary.url && (
 <a
 href={querySummary.url}
 target="_blank"
 rel="noopener noreferrer"
 className="ml-2 hover:underline underline-offset-2 whitespace-nowrap"
 style={{ color: mutedColor, fontSize:"10px" }}
 >
 FDA AEMS <ExternalLinkIcon /> (raw FDA data)
 </a>
 )}
 </div>
 )}
 {/* Per-reaction pill rows */}
 {reactionRows.length > 0 && (
 <ul className="space-y-1.5">
 {reactionRows.map((source) => (
 <li
 key={source.id}
 className="flex items-center justify-between text-xs px-3 py-1.5"
 style={{ backgroundColor:"#F5F3EF", border:"1px solid #E0DDD8" }}
 >
 <span style={{ color: textColor }}>
 {(source.title ??"").replace(/^(FAERS|AEMS):\s*/i,"")}
 </span>
 {source.url && (
 <a
 href={source.url}
 target="_blank"
 rel="noopener noreferrer"
 className="ml-3 shrink-0 hover:underline underline-offset-2 whitespace-nowrap"
 style={{ color: mutedColor, fontSize:"10px" }}
 >
 verify <ExternalLinkIcon /> (raw FDA data)
 </a>
 )}
 </li>
 ))}
 </ul>
 )}
 {/* Inclusion note */}
 <p className="mt-2 text-[10px] leading-relaxed" style={{ color: mutedColor }}>
 Reactions with 2+ reports shown. Unexpected patterns may indicate biological connections.
 </p>
 </>
 );
 })()}
 </div>
 )}

 {/* Reddit post sources — grouped by subreddit */}
 {redditSources.length > 0 && (
 <div>
 {(pubmedSources.length > 0 || faersSources.length > 0 || otSources.length > 0 || otherSources.length > 0) && (
 <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: mutedColor }}>
 Community Posts
 </p>
 )}
 {(() => {
 const grouped: Record<string, Source[]> = {};
 for (const s of redditSources) {
 const sub = s.external_id ??"unknown";
 if (!grouped[sub]) grouped[sub] = [];
 grouped[sub].push(s);
 }
 return Object.entries(grouped).map(([sub, subPosts]) => (
 <div key={sub} className="mb-3 last:mb-0">
 <p className="text-[10px] font-bold mb-1.5" style={{ color: mutedColor }}>
 r/{sub}
 </p>
 <ul
 className="space-y-1.5 pl-3"
 style={{ borderLeft: `2px solid ${borderColor}` }}
 >
 {subPosts.map((source) => (
 <li key={source.id} className="text-xs leading-snug">
 {source.url ? (
 <a
 href={source.url}
 target="_blank"
 rel="noopener noreferrer"
 className="hover:underline underline-offset-2"
 style={{ color: linkColor }}
 >
 {source.title ?? source.url}
 </a>
 ) : (
 <span style={{ color: textColor }}>
 {source.title ??"Reddit post"}
 </span>
 )}
 </li>
 ))}
 </ul>
 </div>
 ));
 })()}
 </div>
 )}

 {/* Open Targets sources */}
 {otSources.length > 0 && (
 <div>
 <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: mutedColor }}>
 Open Targets Platform
 </p>
 <ul className="space-y-3">
 {otSources.map((source) => (
 <li key={source.id} className="text-xs leading-relaxed" style={{ color: textColor }}>
 {source.url ? (
 <a
 href={source.url}
 target="_blank"
 rel="noopener noreferrer"
 className="font-medium hover:underline underline-offset-2"
 style={{ color: linkColor }}
 >
 {source.title ?? source.external_id ?? source.url} <ExternalLinkIcon />
 </a>
 ) : (
 <span className="font-medium" style={{ color: '#333' }}>
 {source.title ?? source.external_id ?? 'Open Targets'}
 </span>
 )}
 {source.key_finding_excerpt && (
 <p className="mt-1.5 italic leading-relaxed" style={{ color: mutedColor }}>
 &ldquo;{source.key_finding_excerpt}&rdquo;
 </p>
 )}
 </li>
 ))}
 </ul>
 </div>
 )}

 {/* Other / unknown source types */}
 {otherSources.length > 0 && (
 <ul className="space-y-3">
 {otherSources.map((source) => (
 <li key={source.id} className="text-xs leading-relaxed" style={{ color: textColor }}>
 <span className="font-medium" style={{ color:"#333" }}>
 {source.title ?? source.external_id ??"Source"}
 </span>
 {source.journal && (
 <span style={{ color: mutedColor }} className="italic">
 , {source.journal}
 </span>
 )}
 </li>
 ))}
 </ul>
 )}

 </div>
 )}
 </div>
 );
}

function SignalCard({ signal }: { signal: Signal }) {
 const hasScoring = signal.confidence_tier != null;
 const hasVisibleScore = signal.total_evidence_score != null && signal.total_evidence_score > 0;
 return (
 <div className="bg-white p-6" style={{ border:"1px solid #E0DDD8" }}>
 {/* Compound name + tier badge */}
 <div className="flex flex-wrap items-start gap-3 mb-4">
 <h3 className="font-heading text-lg font-bold leading-tight" style={{ color:"#333" }}>
 {signal.compounds?.name ??"Unknown compound"}
 </h3>
 {hasScoring
 ? <ConfidenceTierBadge tier={signal.confidence_tier} />
 : signal.evidence_strength && <EvidenceBadge strength={signal.evidence_strength} />
 }
 {signal.effect_direction && <EffectDirectionPill direction={signal.effect_direction} />}
 </div>

 {/* Scoring row — only shown when there are non-zero scores */}
 {hasVisibleScore && (
 <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-[11px]" style={{ color: "#777" }}>
 {signal.replication_level && (
 <span className="flex items-center gap-1.5">
 <ScorePips value={signal.replication_score} />
 Replication: {signal.replication_level}
 </span>
 )}
 {signal.plausibility_level && (
 <span className="flex items-center gap-1.5">
 <ScorePips value={signal.plausibility_score} />
 Plausibility: {signal.plausibility_level}
 </span>
 )}
 <span className="flex items-center gap-1" style={{ color: "#5C6B5D", fontWeight: 600 }}>
 Score: {signal.total_evidence_score}/10
 </span>
 </div>
 )}

 {/* Compound meta tags + source badge */}
 {(signal.compounds?.drug_class || signal.compounds?.fda_status || signal.sources.length > 0) && (
 <div className="flex flex-wrap gap-2 mb-5">
 {signal.compounds?.drug_class && (
 <span
 className="text-[11px] px-2.5 py-0.5"
 style={{ backgroundColor:"#F5F3EF", color:"#111", border:"1px solid #E0DDD8" }}
 >
 {signal.compounds.drug_class}
 </span>
 )}
 {signal.compounds?.fda_status && (
 <span
 className="text-[11px] px-2.5 py-0.5"
 style={{ backgroundColor:"#F5F3EF", color:"#111", border:"1px solid #E0DDD8" }}
 >
 {signal.compounds.fda_status}
 </span>
 )}
 <SourceBadge sources={signal.sources} />
 </div>
 )}

 {/* Safety note — shown for ulipristal acetate / SPRMs */}
 {(signal.compounds?.name ?? "").toLowerCase().includes("ulipristal") && (
 <div
 className="flex gap-3 items-start p-4 mb-4"
 style={{ backgroundColor: "#FEF3E2", border: "1px solid #F0C060" }}
 >
 <svg
 width="15"
 height="15"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 className="mt-0.5 shrink-0"
 style={{ color: "#B45309" }}
 >
 <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
 <line x1="12" y1="9" x2="12" y2="13" />
 <line x1="12" y1="17" x2="12.01" y2="17" />
 </svg>
 <p className="text-sm leading-relaxed" style={{ color: "#78350F" }}>
   Ulipristal acetate was suspended in the EU in 2020 following reports of serious liver injury (hepatotoxicity). The European Medicines Agency recommended suspension of all marketing authorizations.
 </p>
 </div>
 )}

 {/* Body */}
 <div className="space-y-4">
 {signal.summary && (
 <div>
 <FieldLabel>Summary</FieldLabel>
 <p className="text-sm leading-relaxed" style={{ color:"#333" }}>
 {signal.summary}
 </p>
 </div>
 )}
 {signal.mechanism_hypothesis && (
 <div>
 <FieldLabel>Mechanism Hypothesis</FieldLabel>
 <p className="text-sm leading-relaxed" style={{ color:"#111" }}>
 {signal.mechanism_hypothesis}
 </p>
 </div>
 )}
 </div>

 <CollapsibleSources sources={signal.sources} />
 </div>
 );
}

// ── Evidence grouping ────────────────────────────────────────────────────────

const EVIDENCE_ORDER = ["strong","moderate","preliminary"] as const;

const EVIDENCE_LABELS: Record<string, string> = {
 strong:"Strong Evidence",
 moderate:"Moderate Evidence",
 preliminary:"Preliminary Evidence",
};

// Normalize a compound name for duplicate detection:
// lowercase, trim, strip parenthetical suffixes like "(Ozempic/Wegovy/...)"
function normalizeCompoundName(name: string): string {
 return name
 .toLowerCase()
 .replace(/\s*\(.*$/, "") // strip everything from first "(" onward
 .trim();
}

function groupByEvidence(signals: Signal[]): { key: string; label: string; signals: Signal[] }[] {
 // Deduplicate by normalized compound name.
 // When two signals share the same normalized name, keep the one with the longer (more complete) raw name.
 const bestByNorm = new Map<string, Signal>();
 for (const s of signals) {
 const raw = s.compounds?.name ?? "";
 if (!raw) { bestByNorm.set(s.id, s); continue; } // no name — keep by unique id
 const norm = normalizeCompoundName(raw);
 const existing = bestByNorm.get(norm);
 if (!existing) {
 bestByNorm.set(norm, s);
 } else {
 // Keep whichever has the longer raw name
 const existingRaw = existing.compounds?.name ?? "";
 if (raw.length > existingRaw.length) bestByNorm.set(norm, s);
 }
 }
 const deduped = Array.from(bestByNorm.values());

 const buckets: Record<string, Signal[]> = {};
 for (const s of deduped) {
 const key = (s.evidence_strength ??"preliminary").toLowerCase();
 if (!buckets[key]) buckets[key] = [];
 buckets[key].push(s);
 }
 // Known strengths in order, then any unknowns
 const ordered = EVIDENCE_ORDER.filter((k) => buckets[k]?.length);
 const unknown = Object.keys(buckets).filter((k) => !EVIDENCE_ORDER.includes(k as typeof EVIDENCE_ORDER[number]));
 return [...ordered, ...unknown].map((key) => ({
 key,
 label: EVIDENCE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1) +" Evidence",
 signals: buckets[key],
 }));
}

function EvidenceGroup({
 groupKey,
 label,
 count,
 children,
 accentColor ="#4D5E4D",
 badgeBg ="#D8E5D8",
 badgeColor ="#4D5E4D",
}: {
 groupKey: string;
 label: string;
 count: number;
 children: React.ReactNode;
 accentColor?: string;
 badgeBg?: string;
 badgeColor?: string;
}) {
 const defaultOpen = groupKey !=="preliminary";
 const [open, setOpen] = useState(defaultOpen);

 return (
 <div>
 <button
 onClick={() => setOpen(!open)}
 className="w-full flex items-center gap-2 py-3 text-left transition-opacity hover:opacity-70"
 style={{ borderBottom: open ?"none" :"1px solid #E0DDD8" }}
 >
 <svg
 width="14"
 height="14"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2.5"
 strokeLinecap="round"
 strokeLinejoin="round"
 style={{
 color: accentColor,
 transform: open ?"rotate(180deg)" :"none",
 transition:"transform 0.15s",
 flexShrink: 0,
 }}
 >
 <polyline points="6 9 12 15 18 9" />
 </svg>
 <span className="text-sm font-semibold" style={{ color:"#333" }}>{label}</span>
 <span
 className="text-xs px-2 py-0.5 font-semibold"
 style={{ backgroundColor: badgeBg, color: badgeColor }}
 >
 {count}
 </span>
 </button>
 {open && <div className="space-y-4 pt-4 pb-2">{children}</div>}
 </div>
 );
}

// ── Community color palette ───────────────────────────────────────────────────
const community = {
 bg:"#F0F5FB",
 border:"#B8CEDD",
 heading:"#2C3E50",
 body:"#44596A",
 label:"#6B7E8E",
 tagBg:"#DCE9F5",
 tagBorder:"#9DBAD4",
 link:"#2B5F8A",
};

// ── Pathway signal_types: these always win regardless of source
const PATHWAY_SIGNAL_TYPES = new Set(["pathway_signal","caution_signal"]);

// Source types that belong in Cross-Condition
const CROSS_SOURCE_TYPES = new Set(["faers","sider"]);

// Source types that belong in Direct Research
const DIRECT_SOURCE_TYPES = new Set(["pubmed","clinical_trial"]);

function getSignalTab(signal: Signal):"direct" |"cross" |"caution" |"community" {
 // Community reports always go to their own tab
 if (signal.signal_type ==="community_report") return"community";
 // Pathway signal_type overrides everything else
 if (PATHWAY_SIGNAL_TYPES.has(signal.signal_type ??"")) return"caution";

 const sourceTypes = signal.sources.map((s) => s.source_type).filter(Boolean);

 // If any source is AEMS (formerly FAERS) or SIDER → Cross-Condition
 if (sourceTypes.some((t) => CROSS_SOURCE_TYPES.has(t!))) return"cross";

 // If any source is PubMed or ClinicalTrials → Direct Research
 if (sourceTypes.some((t) => DIRECT_SOURCE_TYPES.has(t!))) return"direct";

 // No sources or unknown source type → Direct Research (default)
 return"direct";
}

// Muted amber palette for Pathway signals
const amber = {
 bg:"#FEFAF2",
 border:"#EAD9B0",
 heading:"#5D4B20",
 body:"#7A6030",
 label:"#A08040",
 tagBg:"#F5E8C0",
 tagBorder:"#D4B870",
 link:"#8B6914",
};

function PathwaySignalCard({ signal }: { signal: Signal }) {
 const hasScoring = signal.confidence_tier != null;
 const hasVisibleScore = signal.total_evidence_score != null && signal.total_evidence_score > 0;
 return (
 <div
 className=" p-6"
 style={{ backgroundColor: amber.bg, border: `1px solid ${amber.border}` }}
 >
 {/* Compound name + badge */}
 <div className="flex flex-wrap items-start gap-3 mb-4">
 <svg
 width="14"
 height="14"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 className="mt-1.5 shrink-0"
 style={{ color: amber.label }}
 aria-hidden="true"
 >
 <circle cx="11" cy="11" r="3" />
 <path d="M11 2v2M11 20v2M2 11h2M20 11h2" />
 <path d="m14.5 7.5 1.5-1.5M8 14l-1.5 1.5M14.5 14.5l1.5 1.5M8 8 6.5 6.5" />
 </svg>
 <h3 className="font-heading text-lg font-bold leading-tight" style={{ color: amber.heading }}>
 {signal.compounds?.name ??"Unknown compound"}
 </h3>
 {hasScoring
 ? <ConfidenceTierBadge tier={signal.confidence_tier} />
 : signal.evidence_strength && (
 <span
 className="text-[10px] font-bold px-2.5 py-1 tracking-wider"
 style={{ backgroundColor: amber.tagBg, color: amber.link, border: `1px solid ${amber.tagBorder}` }}
 >
 {signal.evidence_strength.toUpperCase()}
 </span>
 )
 }
 {signal.effect_direction && <EffectDirectionPill direction={signal.effect_direction} />}
 </div>

 {/* Scoring row — only shown when there are non-zero scores */}
 {hasVisibleScore && (
 <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-[11px]" style={{ color: amber.label }}>
 {signal.replication_level && (
 <span className="flex items-center gap-1.5">
 <ScorePips value={signal.replication_score} />
 Replication: {signal.replication_level}
 </span>
 )}
 {signal.plausibility_level && (
 <span className="flex items-center gap-1.5">
 <ScorePips value={signal.plausibility_score} />
 Plausibility: {signal.plausibility_level}
 </span>
 )}
 <span className="flex items-center gap-1" style={{ color: amber.heading, fontWeight: 600 }}>
 Score: {signal.total_evidence_score}/10
 </span>
 </div>
 )}

 {/* Meta tags + source badge */}
 {(signal.compounds?.drug_class || signal.compounds?.fda_status || signal.sources.length > 0) && (
 <div className="flex flex-wrap gap-2 mb-5">
 {signal.compounds?.drug_class && (
 <span
 className="text-[11px] px-2.5 py-0.5"
 style={{ backgroundColor: amber.tagBg, color: amber.body, border: `1px solid ${amber.tagBorder}` }}
 >
 {signal.compounds.drug_class}
 </span>
 )}
 {signal.compounds?.fda_status && (
 <span
 className="text-[11px] px-2.5 py-0.5"
 style={{ backgroundColor: amber.tagBg, color: amber.body, border: `1px solid ${amber.tagBorder}` }}
 >
 {signal.compounds.fda_status}
 </span>
 )}
 <SourceBadge sources={signal.sources} />
 </div>
 )}

 {/* Body */}
 <div className="space-y-4">
 {signal.summary && (
 <div>
 <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: amber.label }}>
 Summary
 </p>
 <p className="text-sm leading-relaxed" style={{ color: amber.heading }}>
 {signal.summary}
 </p>
 </div>
 )}
 {signal.mechanism_hypothesis && (
 <div>
 <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: amber.label }}>
 Pathway Insight
 </p>
 <p className="text-sm leading-relaxed" style={{ color: amber.body }}>
 {signal.mechanism_hypothesis}
 </p>
 </div>
 )}
 </div>

 <CollapsibleSources
 sources={signal.sources}
 linkColor={amber.link}
 textColor={amber.body}
 mutedColor={amber.label}
 borderColor={amber.border}
 />
 </div>
 );
}

type Tab ="direct" |"cross" |"caution" |"community";

export default function ResearchSignalsTabs({ signals }: { signals: Signal[] }) {
 const [activeTab, setActiveTab] = useState<Tab>("direct");

 const directSignals = signals.filter((s) => getSignalTab(s) ==="direct");
 const cautionSignals = signals.filter((s) => getSignalTab(s) ==="caution");
 const crossSignals = signals.filter((s) => getSignalTab(s) ==="cross");
 const communitySignals = signals.filter((s) => getSignalTab(s) ==="community");

 const tabs: { key: Tab; label: string; count: number }[] = [
 { key:"direct", label:"Direct Research", count: directSignals.length },
 { key:"cross", label:"Cross-Condition", count: crossSignals.length },
 { key:"caution", label:"Pathways", count: cautionSignals.length },
 { key:"community", label:"Community Reports", count: communitySignals.length },
 ];

 function tabStyle(key: Tab) {
 const isActive = activeTab === key;
 if (isActive && key ==="caution") {
 return { backgroundColor: amber.tagBg, color: amber.link, border: `1px solid ${amber.tagBorder}` };
 }
 if (isActive && key ==="community") {
 return { backgroundColor: community.tagBg, color: community.link, border: `1px solid ${community.tagBorder}` };
 }
 if (isActive) {
 return { backgroundColor:"#EEF1EE", color:"#5C6B5D", border:"1px solid #7A8B7A" };
 }
 return { backgroundColor:"transparent", color:"#111", border:"1px solid #E0DDD8" };
 }

 return (
 <div>
 {/* Pill tab bar — horizontal scroll on mobile */}
 <div className="no-scrollbar flex gap-2 mb-8 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
 {tabs.map(({ key, label, count }) => (
 <button
 key={key}
 onClick={() => setActiveTab(key)}
 className="shrink-0 px-4 py-2 text-sm font-medium transition-all whitespace-nowrap"
 style={tabStyle(key)}
 >
 {label}
 {count > 0 && (
 <span
 className="ml-1.5 text-xs px-1.5 py-0.5"
 style={
 activeTab === key && key ==="caution"
 ? { backgroundColor: amber.bg, color: amber.label }
 : activeTab === key && key ==="community"
 ? { backgroundColor: community.tagBg, color: community.link }
 : activeTab === key
 ? { backgroundColor:"#D8E5D8", color:"#5C6B5D" }
 : { backgroundColor:"#F0EDE8", color:"#111" }
 }
 >
 {count}
 </span>
 )}
 </button>
 ))}
 </div>

 {/* Direct Research tab */}
 {activeTab ==="direct" && (
 <div>
 {directSignals.length > 0 && (
 <div className="space-y-2 mb-6">
 {groupByEvidence(directSignals).map(({ key, label, signals: group }) => (
 <EvidenceGroup key={key} groupKey={key} label={label} count={group.length}>
 {group.map((signal) => <SignalCard key={signal.id} signal={signal} />)}
 </EvidenceGroup>
 ))}
 </div>
 )}
 {directSignals.length > 0 && !directSignals.some((s) => s.confidence_tier === "Strong" || (s.evidence_strength ?? "").toLowerCase() === "strong") && (
 <p className="text-xs leading-relaxed mb-4" style={{ color: "#999" }}>
 No Strong Evidence signals yet for this condition. This often reflects the broader research landscape: many women&apos;s hormonal conditions remain under-studied, and sparseness in the literature is itself information.
 </p>
 )}
 {directSignals.length < 2 && (
 <div className=" p-4" style={{ backgroundColor:"#F5F3EF", border:"1px solid #E0DDD8" }}>
 <p className="text-sm leading-relaxed" style={{ color:"#111" }}>
 Few or no clinical trials exist specifically targeting this condition. The limited research base is itself evidence of the underfunding problem this tool exists to address.
 </p>
 </div>
 )}
 </div>
 )}

 {/* Cross-Condition tab */}
 {activeTab ==="cross" && (
 <div>
 <div
 className="flex gap-3 items-start p-4 mb-6"
 style={{ backgroundColor:"#EEF1EE", border:"1px solid #D0DAD0" }}
 >
 <svg
 width="14"
 height="14"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 className="mt-0.5 shrink-0"
 style={{ color:"#7A8B7A" }}
 >
 <circle cx="12" cy="12" r="10" />
 <line x1="12" y1="8" x2="12" y2="12" />
 <line x1="12" y1="16" x2="12.01" y2="16" />
 </svg>
 <p className="text-sm leading-relaxed" style={{ color:"#5C6B5D" }}>
 Drugs developed for other conditions where women incidentally reported benefit. Hypothesis-generating, not treatment evidence.
 </p>
 </div>
 {crossSignals.length > 0 && (
 <div className="space-y-2 mb-6">
 {groupByEvidence(crossSignals).map(({ key, label, signals: group }) => (
 <EvidenceGroup key={key} groupKey={key} label={label} count={group.length}>
 {group.map((signal) => <SignalCard key={signal.id} signal={signal} />)}
 </EvidenceGroup>
 ))}
 </div>
 )}
 {crossSignals.length < 2 && (
 <div className=" p-4" style={{ backgroundColor:"#F5F3EF", border:"1px solid #E0DDD8" }}>
 <p className="text-sm leading-relaxed" style={{ color:"#111" }}>
 Cross-condition signal data for this condition is limited in public databases. This may reflect gaps in how women&apos;s health outcomes are tracked in broader drug trials, not an absence of real effects.
 </p>
 </div>
 )}
 </div>
 )}

 {/* Pathways tab */}
 {activeTab ==="caution" && (
 <div>
 <div
 className="flex gap-3 items-start p-4 mb-6"
 style={{ backgroundColor: amber.bg, border: `1px solid ${amber.border}` }}
 >
 <svg
 width="14"
 height="14"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 className="mt-0.5 shrink-0"
 style={{ color: amber.label }}
 aria-hidden="true"
 >
 <circle cx="11" cy="11" r="3" />
 <path d="M11 2v2M11 20v2M2 11h2M20 11h2" />
 <path d="m14.5 7.5 1.5-1.5M8 14l-1.5 1.5M14.5 14.5l1.5 1.5M8 8 6.5 6.5" />
 </svg>
 <p className="text-sm leading-relaxed" style={{ color: amber.body }}>
 Signals derived from biological pathway and target analysis, including drugs with mechanistic or genetic evidence of relevance to this condition, and adverse event patterns that reveal underlying disease biology.
 </p>
 </div>
 {cautionSignals.length > 0 && (
 <div className="space-y-2 mb-6">
 {groupByEvidence(cautionSignals).map(({ key, label, signals: group }) => (
 <EvidenceGroup
 key={key}
 groupKey={key}
 label={label}
 count={group.length}
 accentColor={amber.link}
 badgeBg={amber.tagBg}
 badgeColor={amber.link}
 >
 {group.map((signal) => <PathwaySignalCard key={signal.id} signal={signal} />)}
 </EvidenceGroup>
 ))}
 </div>
 )}
 {cautionSignals.length < 2 && (
 <div className=" p-4" style={{ backgroundColor: amber.bg, border: `1px solid ${amber.border}` }}>
 <p className="text-sm leading-relaxed" style={{ color: amber.body }}>
 No pathway signals have been identified for this condition yet. This section will be updated as more data is available.
 </p>
 </div>
 )}
 </div>
 )}

 {/* Community Forum Reports tab */}
 {activeTab ==="community" && (
 <div>
 {/* Disclaimer */}
 <div
 className="flex gap-3 items-start p-4 mb-6"
 style={{ backgroundColor: community.bg, border: `1px solid ${community.border}` }}
 >
 <svg
 width="14"
 height="14"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 className="mt-0.5 shrink-0"
 style={{ color: community.label }}
 aria-hidden="true"
 >
 <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
 <circle cx="9" cy="7" r="4" />
 <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
 <path d="M16 3.13a4 4 0 0 1 0 7.75" />
 </svg>
 <p className="text-sm leading-relaxed" style={{ color: community.body }}>
 Consistent treatment patterns reported across condition-specific patient communities. These are community signals, not clinical evidence. They are hypothesis generating.
 </p>
 </div>

 {communitySignals.length > 0 && (
 <div className="space-y-2 mb-6">
 {groupByEvidence(communitySignals).map(({ key, label, signals: group }) => (
 <EvidenceGroup
 key={key}
 groupKey={key}
 label={label}
 count={group.length}
 accentColor={community.link}
 badgeBg={community.tagBg}
 badgeColor={community.link}
 >
 {group.map((signal) => <SignalCard key={signal.id} signal={signal} />)}
 </EvidenceGroup>
 ))}
 </div>
 )}

 {communitySignals.length === 0 && (
 <div className=" p-4" style={{ backgroundColor: community.bg, border: `1px solid ${community.border}` }}>
 <p className="text-sm leading-relaxed" style={{ color: community.body }}>
 Community forum data for this condition has not been processed yet.
 </p>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
